import time
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Dict, Any, Optional
from app.schemas.schemas import RequirementSchema, SellerSchema, DiscoverySearchResponseSchema, DealRecommendationResponseSchema
from app.agents.requirement_agent import analyze_requirement
from app.agents.discovery_agent import discover_sellers, discovery_engine
from app.agents.negotiation_agent import negotiation_agent_engine
from app.agents.deal_intelligence_agent import calculate_deal_scores, deal_intelligence_agent
from app.core.fact_bus import fact_bus
from app.core.rules_engine import rules_engine
from app.core.dependencies import get_current_user, require_permission, require_any_permission
from app.core.rbac import Permission

router = APIRouter()

@router.get("/db/health", dependencies=[Depends(require_permission(Permission.ANALYTICS_READ))])
def api_get_db_health():
    """Returns MongoDB Atlas cluster status and collection statistics. Requires: analytics:read"""
    from app.core.observability import check_database_health
    return check_database_health()

@router.get("/v1/market/nearby-sellers")
def api_get_nearby_real_sellers(
    latitude: float = Query(15.4328, description="User latitude"),
    longitude: float = Query(75.6318, description="User longitude"),
    radius: float = Query(5000.0, ge=100.0, le=50000.0, description="Radius in meters"),
    category: str = Query("Electronics"),
    query: Optional[str] = Query(None, description="Optional search text query")
):
    """
    Fetches real business places from Google Maps Platform Places API (New).
    Enforces place_id preservation, distance calculation, and honest error states.
    Never fabricates missing data or falls back to mock seller records.
    """
    from app.core.google_places_service import places_discovery_service
    return places_discovery_service.fetch_nearby_real_sellers(
        lat=latitude,
        lng=longitude,
        radius_meters=radius,
        category=category,
        query_text=query
    )

@router.get("/v1/location/reverse-geocode")
def api_reverse_geocode(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="Latitude"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="Longitude")
):
    """
    Reverse geocodes GPS coordinates into human-readable address.
    Validates lat/lng bounds.
    """
    from app.core.location_service import location_service
    try:
        return location_service.reverse_geocode(latitude, longitude)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/v1/location/session")
def api_create_location_session(payload: Dict[str, Any]):
    """
    Creates a privacy-preserving user location session.
    Validates coordinates, accuracy radius, and timestamp.
    """
    from app.core.location_service import location_service, LocationSessionPayloadSchema
    try:
        validated_payload = LocationSessionPayloadSchema.model_validate(payload)
        return location_service.create_location_session(validated_payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid location payload: {str(e)}")

@router.get("/v1/sellers/check-connection/{place_id}")
def api_check_seller_connection_status(place_id: str):
    """Checks whether a Google Place ID has completed onboarding & verification."""
    from app.core.seller_onboarding_service import seller_onboarding_service
    return seller_onboarding_service.check_seller_connection_status(place_id)

@router.post("/v1/sellers/invite")
def api_invite_unconnected_seller(payload: Dict[str, Any]):
    """Generates an authorized invitation for an unconnected merchant place."""
    from app.core.seller_onboarding_service import seller_onboarding_service, SellerInvitePayloadSchema
    try:
        validated = SellerInvitePayloadSchema.model_validate(payload)
        return seller_onboarding_service.invite_seller(validated)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/v1/sellers/claim")
def api_claim_seller_account(payload: Dict[str, Any]):
    """Initiates merchant account claim flow."""
    from app.core.seller_onboarding_service import seller_onboarding_service, SellerClaimPayloadSchema
    try:
        validated = SellerClaimPayloadSchema.model_validate(payload)
        return seller_onboarding_service.claim_business_account(validated)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/v1/sellers/verify-claim")
def api_verify_seller_claim(payload: Dict[str, Any]):
    """Verifies merchant claim code and sets status to CONNECTED."""
    from app.core.seller_onboarding_service import seller_onboarding_service, SellerVerificationSchema
    try:
        validated = SellerVerificationSchema.model_validate(payload)
        return seller_onboarding_service.verify_claim(validated)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/v1/sellers/config")
def api_update_seller_config(payload: Dict[str, Any]):
    """Configures seller floor price, max rounds, and AI negotiation controls."""
    from app.core.seller_onboarding_service import seller_onboarding_service, SellerConfigSchema
    try:
        validated = SellerConfigSchema.model_validate(payload)
        return seller_onboarding_service.update_seller_config(validated)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/v1/negotiation/real/prerequisites")
def api_check_negotiation_prerequisites(
    customer_id: str = Query(..., description="Customer ID or Email"),
    seller_id: str = Query(..., description="Seller ID or Place ID"),
    channel: str = Query("IN_APP_PORTAL", description="Communication Channel")
):
    """Verifies all 6 mandatory prerequisites before initiating real seller negotiations."""
    from app.core.real_negotiation_channel import real_negotiation_channel
    return real_negotiation_channel.verify_negotiation_prerequisites(customer_id, seller_id, channel)

@router.post("/v1/negotiation/real/start")
def api_start_real_negotiation(payload: Dict[str, Any]):
    """
    Initiates real outbound seller negotiation message if all 6 prerequisites pass.
    Validates proposed price against Rules Engine before dispatch.
    """
    from app.core.real_negotiation_channel import real_negotiation_channel
    session_id = payload.get("session_id", f"sess-real-{int(time.time())}")
    customer_id = payload.get("customer_id", "")
    seller_id = payload.get("seller_id", "")
    proposed_price = payload.get("proposed_price", 0.0)
    channel = payload.get("channel", "IN_APP_PORTAL")

    return real_negotiation_channel.start_real_negotiation(
        session_id=session_id,
        customer_id=customer_id,
        seller_id=seller_id,
        initial_counter_price=proposed_price,
        channel=channel
    )

@router.post("/v1/negotiation/real/inbound-webhook")
def api_process_inbound_seller_webhook(payload: Dict[str, Any]):
    """Receives live inbound merchant webhook responses and parses offers strictly."""
    from app.core.real_negotiation_channel import real_negotiation_channel
    session_id = payload.get("session_id", "")
    seller_id = payload.get("seller_id", "")
    raw_message = payload.get("raw_message", "")
    channel = payload.get("channel", "IN_APP_PORTAL")

    return real_negotiation_channel.process_inbound_seller_webhook(
        session_id=session_id,
        seller_id=seller_id,
        raw_message=raw_message,
        channel=channel
    )

@router.get("/v1/negotiation/real/status/{session_id}/{seller_id}")
def api_get_real_seller_status(session_id: str, seller_id: str):
    """
    Queries live response status for a real seller negotiation.
    If no response has been received, returns status = 'NO_RESPONSE' (never 'NEGOTIATING').
    """
    from app.core.real_negotiation_channel import real_negotiation_channel
    return real_negotiation_channel.check_seller_response_status(session_id, seller_id)


@router.get("/v1/fact-bus/events/{session_id}")
def api_get_fact_bus_events(session_id: str):
    """Retrieves immutable event stream for a session. Returns honest 'No negotiation events yet.' if empty."""
    from app.core.fact_bus_real import real_fact_bus
    return real_fact_bus.get_events_for_session(session_id)

@router.get("/v1/fact-bus/state/{session_id}")
def api_get_fact_bus_materialized_state(session_id: str):
    """Replays immutable event log to build materialized session state."""
    from app.core.fact_bus_real import real_fact_bus
    return real_fact_bus.materialize_session_state(session_id)

@router.post("/v1/fact-bus/publish")
def api_publish_fact_bus_event(payload: Dict[str, Any]):
    """Publishes an authentic platform event to the immutable Fact Bus event store."""
    from app.core.fact_bus_real import real_fact_bus
    try:
        evt = real_fact_bus.publish_event(
            event_type=payload["event_type"],
            actor_type=payload["actor_type"],
            actor_id=payload["actor_id"],
            session_id=payload["session_id"],
            source=payload["source"],
            payload=payload.get("payload", {})
        )
        return evt.model_dump()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/v1/ai/tools")
def api_list_ai_tools():
    """Lists all 13 registered real AI agent tool definitions."""
    from app.core.ai_tool_calling_engine import ai_tool_calling_engine
    return {
        "count": len(ai_tool_calling_engine.list_registered_tools()),
        "tools": ai_tool_calling_engine.list_registered_tools()
    }

@router.post("/v1/ai/tool-call/execute")
def api_execute_ai_tool_call(payload: Dict[str, Any]):
    """
    Executes an AI tool call through the 6-step pipeline:
    Validate Arguments -> Check Authorization -> Execute Service -> Validate Response -> Audit Event -> Return Result.
    """
    from app.core.ai_tool_calling_engine import ai_tool_calling_engine, ToolExecutionRequestSchema
    try:
        req = ToolExecutionRequestSchema.model_validate(payload)
        res = ai_tool_calling_engine.execute_tool_call(req)
        return res.model_dump()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/requirements/analyze", response_model=RequirementSchema)
def api_analyze_requirement(payload: Dict[str, Any]):
    prompt = payload.get("prompt", "")
    language = payload.get("language", "en")
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
    return analyze_requirement(prompt, language)

@router.get("/sellers/discover", response_model=DiscoverySearchResponseSchema)
def api_discover_sellers(
    category: str = Query("Computers"),
    location: str = Query("Hulkoti Market, Gadag"),
    max_distance_km: float = Query(10.0, ge=0.1, le=100.0),
    min_rating: float = Query(0.0, ge=0.0, le=5.0),
    sort_by: str = Query("match_score"),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50)
):
    req = RequirementSchema(
        product=f"Target {category} Item",
        category=category,
        quantity="1 Unit",
        budget=60000.0,
        location=location,
        originalPrompt=""
    )
    return discovery_engine.discover_and_rank(
        requirement=req,
        category_filter=category,
        max_distance_km=max_distance_km,
        min_rating=min_rating,
        sort_by=sort_by,
        skip=skip,
        limit=limit
    )

@router.post("/negotiation/start")
def api_start_negotiation(
    requirement: RequirementSchema,
    current_user: Dict[str, Any] = Depends(require_permission(Permission.NEGOTIATION_CREATE))
):
    """Starts a negotiation session. Requires: negotiation:create"""
    sellers = discover_sellers(requirement)
    session = negotiation_agent_engine.start_session(requirement, sellers)
    # Stamp owner_id on the session for ownership enforcement
    session_data = fact_bus.to_dict()
    session_data["owner_id"] = current_user["id"]
    return session_data

@router.post("/demo/reset")
def reset_demo_scenario():
    """Resets the deterministic benchmark demo scenario."""
    from app.core.demo_engine import demo_engine
    return demo_engine.reset_demo()

@router.post("/demo/step")
def advance_demo_scenario():
    """Advances the deterministic benchmark demo scenario by one round."""
    from app.core.demo_engine import demo_engine
    return demo_engine.advance_demo_step()

@router.post("/negotiation/step")
def api_step_negotiation(
    current_user: Dict[str, Any] = Depends(require_permission(Permission.NEGOTIATION_CREATE))
):
    """Advances negotiation one round. Requires: negotiation:create"""
    has_more = negotiation_agent_engine.advance_step()
    return {
        "hasMore": has_more,
        "session": fact_bus.to_dict()
    }

@router.post("/negotiation/fast-forward")
def api_fast_forward_negotiation(
    current_user: Dict[str, Any] = Depends(require_permission(Permission.NEGOTIATION_CREATE))
):
    """Fast-forwards negotiation to completion. Requires: negotiation:create"""
    while negotiation_agent_engine.advance_step():
        pass
    return fact_bus.to_dict()

@router.get("/fact-bus/session")
def api_get_fact_bus_session():
    return fact_bus.to_dict()

@router.get("/fact-bus/{session_id}")
def api_get_fact_bus_by_session_id(session_id: str):
    """Returns materialized session snapshot and immutable event log by session ID."""
    if session_id == fact_bus.session_id:
        return fact_bus.to_dict()
    
    # Query MongoDB Atlas
    from app.core.database import negotiation_sessions_col
    session_data = negotiation_sessions_col.find_one({"_id": session_id})
    if not session_data:
        raise HTTPException(status_code=404, detail=f"Fact Bus session '{session_id}' not found")
    return session_data

@router.post("/fact-bus/update")
def api_manual_seller_counter(
    payload: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_permission(Permission.OFFER_CREATE_OWN))
):
    """
    Submits a seller counter-offer via the Seller Portal. Requires: offer:create:own
    Layer 3 ownership: verifies seller_id belongs to the authenticated user.
    """
    seller_id = payload.get("seller_id")
    new_price = payload.get("price")
    message = payload.get("message", "Manual counter offer submitted via Seller Portal")

    if not seller_id or new_price is None:
        raise HTTPException(status_code=400, detail="seller_id and price required")

    # Layer 3 — Ownership: Seller can only submit offers for THEIR OWN store
    from app.core.ownership import assert_seller_owner
    assert_seller_owner(seller_id, current_user["id"], current_user.get("role", "SELLER"))

    seller = next((s for s in fact_bus.active_sellers if s.id == seller_id), None)
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found in active session")

    # Enforce Business Rules Engine (AI safety gate)
    is_valid, validated_price, rationale = rules_engine.validate_and_enforce_proposal(
        seller_id=seller_id,
        proposed_price=new_price,
        current_price=fact_bus.offers[seller_id].price if seller_id in fact_bus.offers else new_price,
        customer_budget=fact_bus.requirement.budget if fact_bus.requirement else 60000.0,
        seller_flexibility_pct=seller.flexibility,
        current_round=fact_bus.current_round + 1,
        best_fact_bus_offer=fact_bus.best_offer
    )

    fact_bus.update_offer(
        seller_id=seller_id,
        price=validated_price,
        status="counter_offer",
        last_message=f"{seller.name}: ₹{validated_price:,.0f} ({rationale})"
    )

    fact_bus.add_event(
        event_type="COUNTER_OFFER",
        message=f"🏪 SELLER PORTAL: {seller.name} submitted counter offer of ₹{validated_price:,.0f}",
        seller_id=seller_id,
        seller_name=seller.name,
        price=validated_price
    )

    return fact_bus.to_dict()

@router.get("/recommendations", response_model=DealRecommendationResponseSchema)
def api_get_recommendations(
    current_user: Dict[str, Any] = Depends(require_permission(Permission.NEGOTIATION_READ_OWN))
):
    """Returns deal recommendations for active session. Requires: negotiation:read:own"""
    return deal_intelligence_agent.calculate_deal_recommendations()


@router.get("/recommendations/{session_id}", response_model=DealRecommendationResponseSchema)
def api_get_recommendations_by_session_id(
    session_id: str,
    current_user: Dict[str, Any] = Depends(require_permission(Permission.NEGOTIATION_READ_OWN))
):
    """
    Returns deal recommendations by session ID. Requires: negotiation:read:own
    Layer 3 ownership enforced: user must own the session (ADMINs bypass).
    """
    if session_id == fact_bus.session_id:
        return deal_intelligence_agent.calculate_deal_recommendations()

    from app.core.database import negotiation_sessions_col
    from app.core.ownership import assert_negotiation_owner

    session_data = negotiation_sessions_col.find_one({"_id": session_id})
    if not session_data:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")

    # Layer 3 — Ownership check (raises 403 if user doesn't own session)
    assert_negotiation_owner(session_id, current_user["id"], current_user.get("role", "CUSTOMER"))

    return deal_intelligence_agent.calculate_deal_recommendations(session_data)
