import pytest
from app.core.fact_bus_real import real_fact_bus

def test_empty_session_honest_message():
    """Invariance Check: Empty sessions return 'No negotiation events yet.' without fake data."""
    res = real_fact_bus.get_events_for_session("sess-empty-999")
    assert res["events"] == []
    assert res["count"] == 0
    assert res["message"] == "No negotiation events yet."

    state = real_fact_bus.materialize_session_state("sess-empty-999")
    assert state["current_state"] == "IDLE"
    assert state["total_events_replayed"] == 0

def test_publish_authentic_event_and_materialize():
    import uuid
    sess_id = f"sess-real-factbus-{uuid.uuid4().hex[:6]}"

    # 1. Publish Requirement Extracted Event
    evt1 = real_fact_bus.publish_event(
        event_type="REQUIREMENT_EXTRACTED",
        actor_type="CUSTOMER",
        actor_id="usr-customer-1",
        session_id=sess_id,
        source="AIReliabilityEngine",
        payload={"category": "Laptops", "budget": 60000.0}
    )
    assert evt1.event_id.startswith("evt-")
    assert evt1.schema_version == "v1.0"

    # 2. Publish Seller Discovered Event
    evt2 = real_fact_bus.publish_event(
        event_type="SELLER_DISCOVERED",
        actor_type="EXTERNAL_PROVIDER",
        actor_id="GooglePlacesAPI",
        session_id=sess_id,
        source="GOOGLE_PLACES_API",
        payload={"place_id": "ChIJ_123", "name": "Panchayat Tech Plaza"}
    )
    assert evt2.actor_type == "EXTERNAL_PROVIDER"

    # 3. Publish Offer Received Event
    evt3 = real_fact_bus.publish_event(
        event_type="OFFER_RECEIVED",
        actor_type="SELLER",
        actor_id="seller-c",
        session_id=sess_id,
        source="IN_APP_PORTAL",
        payload={"seller_id": "seller-c", "price": 58900.0, "warranty": "1 Year"}
    )
    assert evt3.actor_type == "SELLER"

    # 4. Verify Stream Output
    stream = real_fact_bus.get_events_for_session(sess_id)
    assert stream["count"] == 3

    # 5. Verify Materialized Session State Replay
    state = real_fact_bus.materialize_session_state(sess_id)
    assert state["current_state"] == "NEGOTIATING"
    assert state["extracted_requirement"]["budget"] == 60000.0
    assert len(state["discovered_sellers"]) == 1
    assert state["best_offer"]["price"] == 58900.0
    assert state["total_events_replayed"] == 3
