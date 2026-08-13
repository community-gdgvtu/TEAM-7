import pytest
from app.core.demo_engine import demo_engine
from app.core.fact_bus import fact_bus

def test_demo_mode_reset():
    """Tests resetting the demo mode benchmark scenario."""
    res = demo_engine.reset_demo()
    assert res["status"] == "DEMO_RESET_SUCCESS"
    assert "demo-session-" in res["session_id"]
    assert len(demo_engine.DEMO_SELLERS) == 4

def test_demo_mode_step_progression():
    """Tests 4-round step progression of the demo scenario."""
    demo_engine.reset_demo()

    # Round 1: Initial Quotes
    step1 = demo_engine.advance_demo_step()
    assert step1["round"] == 1
    assert fact_bus.best_offer == 62000.0 # Seller C initial offer

    # Round 2: Seller B Counter Offer
    step2 = demo_engine.advance_demo_step()
    assert step2["round"] == 2
    assert fact_bus.best_offer == 59500.0 # Seller B counter offer

    # Round 3: Winning Offer by Seller C
    step3 = demo_engine.advance_demo_step()
    assert step3["round"] == 3
    assert fact_bus.best_offer == 58900.0 # Seller C winning offer

    # Round 4: Negotiation Completion
    step4 = demo_engine.advance_demo_step()
    assert step4["completed"] is True
    assert demo_engine.completed is True
