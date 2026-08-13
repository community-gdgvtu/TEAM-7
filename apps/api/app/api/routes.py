from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Dict, Any
from app.schemas.schemas import RequirementSchema, SellerSchema, DiscoverySearchResponseSchema, DealRecommendationResponseSchema
from app.agents.requirement_agent import analyze_requirement
from app.agents.discovery_agent import discover_sellers, discovery_engine
from app.agents.negotiation_agent import negotiation_agent_engine
from app.agents.deal_intelligence_agent import calculate_deal_scores, deal_intelligence_agent
from app.core.fact_bus import fact_bus
from app.core.rules_engine import rules_engine
from app.core.dependencies import get_current_user, get_current_admin, get_current_seller

router = APIRouter()

@router.get("/db/health", dependencies=[Depends(get_current_admin)])
def api_get_db_health():
    """Returns MongoDB Atlas cluster status and collection statistics (ADMIN ONLY)."""
    return get_database_status()

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
def api_start_negotiation(requirement: RequirementSchema):
    sellers = discover_sellers(requirement)
    negotiation_agent_engine.start_session(requirement, sellers)
    return fact_bus.to_dict()

@router.post("/negotiation/step")
def api_step_negotiation():
    has_more = negotiation_agent_engine.advance_step()
    return {
        "hasMore": has_more,
        "session": fact_bus.to_dict()
    }

@router.post("/negotiation/fast-forward")
def api_fast_forward_negotiation():
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
def api_manual_seller_counter(payload: Dict[str, Any]):
    seller_id = payload.get("seller_id")
    new_price = payload.get("price")
    message = payload.get("message", "Manual counter offer submitted via Seller Portal")

    if not seller_id or new_price is None:
        raise HTTPException(status_code=400, detail="seller_id and price required")

    seller = next((s for s in fact_bus.active_sellers if s.id == seller_id), None)
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found in session")

    # Enforce Business Rules Engine
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
def api_get_recommendations():
    return deal_intelligence_agent.calculate_deal_recommendations()

@router.get("/recommendations/{session_id}", response_model=DealRecommendationResponseSchema)
def api_get_recommendations_by_session_id(session_id: str):
    """Returns reproducible multi-factor deal recommendation by session ID."""
    if session_id == fact_bus.session_id:
        return deal_intelligence_agent.calculate_deal_recommendations()
    
    # Query MongoDB Atlas
    from app.core.database import negotiation_sessions_col
    session_data = negotiation_sessions_col.find_one({"_id": session_id})
    if not session_data:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")
    
    return deal_intelligence_agent.calculate_deal_recommendations(session_data)
