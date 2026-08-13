import pytest
from app.core.seller_onboarding_service import (
    seller_onboarding_service,
    SellerInvitePayloadSchema,
    SellerClaimPayloadSchema,
    SellerVerificationSchema,
    SellerConfigSchema
)

def test_unconnected_place_id_status_invariant():
    """Invariance Check: Unconnected Google Place ID MUST NOT be connected automatically."""
    status = seller_onboarding_service.check_seller_connection_status("place-unconnected-999")
    assert status["connection_status"] == "DISCOVERED"
    assert status["is_connected"] is False
    assert status["ai_negotiation_enabled"] is False

def test_seller_onboarding_full_lifecycle():
    place_id = "ChIJ_test_google_place_123"
    
    # 1. Invite Seller
    invite_res = seller_onboarding_service.invite_seller(SellerInvitePayloadSchema(
        place_id=place_id,
        place_name="Gadag Electronics & Laptops",
        contact_phone_or_email="+91 98450 99999"
    ))
    assert invite_res["status"] == "INVITATION_SENT"

    # 2. Claim Account
    claim_res = seller_onboarding_service.claim_business_account(SellerClaimPayloadSchema(
        place_id=place_id,
        seller_name="Gadag Electronics & Laptops",
        owner_name="Suresh Patil",
        owner_phone="+91 98450 99999",
        owner_email="suresh@gadagelectronics.com"
    ))
    assert claim_res["status"] == "CLAIM_PENDING_VERIFICATION"
    claim_id = claim_res["claim_id"]

    # 3. Verify Code -> Status becomes CONNECTED
    verify_res = seller_onboarding_service.verify_claim(SellerVerificationSchema(
        claim_id=claim_id,
        verification_code="654321"
    ))
    assert verify_res["connection_status"] == "CONNECTED"

    # 4. Configure Pricing & Enable AI -> Status becomes NEGOTIATION_ENABLED
    config_res = seller_onboarding_service.update_seller_config(SellerConfigSchema(
        seller_id=verify_res["seller_id"],
        place_id=place_id,
        minimum_acceptable_price=55000.0,
        max_negotiation_rounds=5,
        ai_negotiation_enabled=True,
        approval_required_for_final_offer=True
    ))
    assert config_res["connection_status"] == "NEGOTIATION_ENABLED"
    assert config_res["ai_negotiation_enabled"] is True

    # 5. Check Connection Status now returns CONNECTED and ENABLED
    final_status = seller_onboarding_service.check_seller_connection_status(place_id)
    assert final_status["is_connected"] is True
    assert final_status["ai_negotiation_enabled"] is True
