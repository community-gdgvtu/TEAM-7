import pytest
from app.core.real_negotiation_channel import real_negotiation_channel

def test_prerequisites_blocking_unconnected_seller():
    """Invariance Check: Real negotiation CANNOT start for unconnected sellers."""
    check = real_negotiation_channel.verify_negotiation_prerequisites(
        customer_id="usr-test-1",
        seller_id="place-unconnected-placeid-99",
        channel="IN_APP_PORTAL"
    )
    assert check["all_passed"] is False
    assert check["prerequisites"]["seller_connected"] is False
    assert check["prerequisites"]["seller_negotiation_enabled"] is False

def test_prerequisites_passed_for_connected_seller():
    """Verifies that connected & enabled sellers pass all 6 prerequisites."""
    check = real_negotiation_channel.verify_negotiation_prerequisites(
        customer_id="usr-test-1",
        seller_id="seller-1",
        channel="IN_APP_PORTAL"
    )
    assert check["prerequisites"]["customer_exists"] is True
    assert check["prerequisites"]["seller_exists"] is True
    assert check["prerequisites"]["channel_available"] is True

def test_invalid_channel_blocks_prerequisites():
    """Verifies that unsupported communication channels fail prerequisite #6."""
    check = real_negotiation_channel.verify_negotiation_prerequisites(
        customer_id="usr-test-1",
        seller_id="seller-1",
        channel="INVALID_TELEPATHY_CHANNEL"
    )
    assert check["all_passed"] is False
    assert check["prerequisites"]["channel_available"] is False

def test_start_real_negotiation_outbound_dispatch():
    res = real_negotiation_channel.start_real_negotiation(
        session_id="sess-real-test-1",
        customer_id="usr-test-1",
        seller_id="seller-1",
        proposed_price=58000.0,
        channel="WHATSAPP_BUSINESS_API"
    )
    assert "status" in res
    assert res["channel"] == "WHATSAPP_BUSINESS_API"
    assert res["delivery_status"] == "SENT"
    assert res["seller_status"] == "WAITING_FOR_SELLER_RESPONSE"

def test_rules_engine_blocks_invalid_ai_proposal():
    """Verifies that AI counter-offers violating floor prices or bounds get blocked before dispatch."""
    res = real_negotiation_channel.start_real_negotiation(
        session_id="sess-real-test-rules",
        customer_id="usr-test-1",
        seller_id="seller-1",
        proposed_price=1.0, # Unrealistically low price violating floor price
        channel="IN_APP_PORTAL"
    )
    assert res["status"] == "BLOCKED_RULES_VIOLATION"
    assert "error" in res

def test_process_inbound_seller_webhook():
    raw_text = "Yes, we can give this coding laptop for ₹58,500 with 2 Years Brand Warranty."
    inbound = real_negotiation_channel.process_inbound_seller_webhook(
        session_id="sess-real-test-1",
        seller_id="seller-1",
        raw_message=raw_text,
        channel="WHATSAPP_BUSINESS_API"
    )

    assert inbound.message_id.startswith("msg-in-")
    assert inbound.channel == "WHATSAPP_BUSINESS_API"
    assert inbound.raw_message == raw_text
    assert inbound.parsed_offer is not None
    assert inbound.parsed_offer["price"] == 58500.0
    assert inbound.verification_status == "VERIFIED"

def test_seller_no_response_status_invariant():
    """Invariance Check: Unanswered seller requests MUST yield status = NO_RESPONSE, NOT NEGOTIATING."""
    status_check = real_negotiation_channel.check_seller_response_status(
        session_id="sess-unanswered-9999",
        seller_id="seller-no-reply-1"
    )
    assert status_check["seller_status"] == "NO_RESPONSE"
    assert status_check["is_responding"] is False
    assert status_check["raw_message"] is None
    assert status_check["parsed_offer"] is None
    assert status_check["seller_status"] != "NEGOTIATING"
