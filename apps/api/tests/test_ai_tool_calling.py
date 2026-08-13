import pytest
from app.core.ai_tool_calling_engine import ai_tool_calling_engine, ToolExecutionRequestSchema

def test_13_mandatory_tools_registered():
    tools = ai_tool_calling_engine.list_registered_tools()
    assert len(tools) == 13
    
    expected = [
        "search_nearby_sellers", "get_place_details", "get_seller_connection_status",
        "get_seller_catalog", "create_negotiation", "send_seller_message",
        "get_seller_response", "extract_offer", "verify_offer",
        "update_fact_bus", "rank_offers", "compute_route", "get_market_statistics"
    ]
    for t in expected:
        assert t in tools

def test_tool_execution_pipeline_success():
    req = ToolExecutionRequestSchema(
        tool_name="extract_offer",
        arguments={"raw_text": "We offer coding laptops for ₹58,900 with 1 Year Warranty."},
        user_id="usr-test-1",
        user_role="CUSTOMER",
        session_id="sess-tool-1"
    )
    res = ai_tool_calling_engine.execute_tool_call(req)
    assert res.status == "SUCCESS"
    assert res.result["price"] == 58900.0
    assert res.audit_event_id.startswith("toolcall-")
    assert res.latency_ms > 0

def test_tool_execution_unregistered_validation_error():
    req = ToolExecutionRequestSchema(
        tool_name="non_existent_tool",
        arguments={},
        user_id="usr-test-1",
        user_role="CUSTOMER",
        session_id="sess-tool-1"
    )
    res = ai_tool_calling_engine.execute_tool_call(req)
    assert res.status == "VALIDATION_ERROR"
    assert "not a registered AI tool" in res.result["error"]

def test_tool_execution_authorization_check():
    req = ToolExecutionRequestSchema(
        tool_name="create_negotiation",
        arguments={},
        user_id="usr-guest",
        user_role="GUEST", # Unauthorized role
        session_id="sess-tool-1"
    )
    res = ai_tool_calling_engine.execute_tool_call(req)
    assert res.status == "AUTHORIZATION_ERROR"
    assert "Unauthorized" in res.result["error"]
