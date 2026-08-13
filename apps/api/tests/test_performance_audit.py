import time
import pytest
from app.agents.requirement_agent import analyze_requirement
from app.agents.discovery_agent import discovery_engine
from app.agents.negotiation_agent import negotiation_agent_engine
from app.core.database import db, get_database_status
from app.schemas.schemas import RequirementSchema

def test_measure_database_query_latency():
    """Measures MongoDB Atlas ping & index query latency."""
    start = time.time()
    db.command("ping")
    db_latency_ms = round((time.time() - start) * 1000, 2)

    # DB latency invariant: < 500ms (MongoDB Atlas Cloud Cluster network latency)
    assert db_latency_ms < 500.0

def test_measure_ai_extraction_latency():
    """Measures Requirement Extraction Agent latency."""
    start = time.time()
    req = analyze_requirement("I need a phone under ₹20,000", language="en")
    ai_latency_ms = round((time.time() - start) * 1000, 2)

    assert req.budget == 20000.0
    # AI extraction latency invariant: < 100ms for deterministic rule-guided parser
    assert ai_latency_ms < 100.0

def test_measure_negotiation_completion_time():
    """Measures end-to-end multi-round negotiation completion speed."""
    req = RequirementSchema(
        product="Coding Laptop", category="Computers", budget=60000.0, location="Hulkoti Market"
    )
    discovery_res = discovery_engine.discover_and_rank(req, category_filter="Computers")
    sellers = [d.seller for d in discovery_res.sellers]

    start = time.time()
    negotiation_agent_engine.start_session(req, sellers)

    rounds = 0
    while negotiation_agent_engine.advance_step():
        rounds += 1
        if rounds > 10:
            break

    total_negotiation_time_sec = round(time.time() - start, 3)

    # Negotiation completion invariant: completes in < 30.0 seconds
    assert total_negotiation_time_sec < 30.0
