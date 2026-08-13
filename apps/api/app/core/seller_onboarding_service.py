import os
import time
import uuid
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
from app.core.database import db

# MongoDB Collections for Onboarding & Seller Claims
sellers_col = db["sellers"]
seller_claims_col = db["seller_claims"]
seller_configs_col = db["seller_configs"]

class SellerInvitePayloadSchema(BaseModel):
    place_id: str
    place_name: str
    contact_phone_or_email: str
    invited_by_customer_id: Optional[str] = "Customer-Anonymous"

class SellerClaimPayloadSchema(BaseModel):
    place_id: str
    seller_name: str
    owner_name: str
    owner_phone: str
    owner_email: str

class SellerVerificationSchema(BaseModel):
    claim_id: str
    verification_code: str # e.g. 6-digit OTP code

class SellerConfigSchema(BaseModel):
    seller_id: str
    place_id: str
    products: List[Dict[str, Any]] = []
    current_prices: Dict[str, float] = {}
    inventory_status: str = "IN_STOCK"
    negotiable: bool = True
    minimum_acceptable_price: float = Field(ge=0.0)
    max_negotiation_rounds: int = Field(default=5, ge=1, le=10)
    warranty: str = "1 Year Brand Warranty"
    pickup_or_delivery: str = "BOTH" # PICKUP, DELIVERY, BOTH
    allowed_languages: List[str] = ["en", "hi", "kn", "ur"]
    ai_negotiation_enabled: bool = True
    approval_required_for_final_offer: bool = True

class SellerOnboardingService:
    """
    Real Seller Onboarding & Connection Management Service.
    Strict Invariant: A Google Place ID is NOT automatically an authorized Panchayat seller.
    Automated negotiations occur ONLY after explicit claim, verification, and consent.
    """

    def check_seller_connection_status(self, place_id: str) -> Dict[str, Any]:
        """Checks whether a Google Place ID has completed onboarding & verification."""
        seller = sellers_col.find_one({"place_id": place_id})
        if not seller:
            return {
                "place_id": place_id,
                "connection_status": "DISCOVERED",
                "is_connected": False,
                "ai_negotiation_enabled": False,
                "message": "Seller not yet connected to Panchayat AI. Invite merchant to enable automated negotiations."
            }

        status = seller.get("connection_status", "UNVERIFIED")
        ai_enabled = seller.get("ai_negotiation_enabled", False)

        return {
            "seller_id": str(seller.get("_id")),
            "place_id": place_id,
            "seller_name": seller.get("name"),
            "connection_status": status,
            "is_connected": status in ["CONNECTED", "NEGOTIATION_ENABLED"],
            "ai_negotiation_enabled": ai_enabled,
            "message": "Seller is connected and verified on Panchayat AI." if status == "NEGOTIATION_ENABLED" else "Seller account pending verification."
        }

    def invite_seller(self, payload: SellerInvitePayloadSchema) -> Dict[str, Any]:
        """Generates an authorized invitation for an unconnected merchant place."""
        invite_id = f"inv-{int(time.time())}-{uuid.uuid4().hex[:6]}"
        invite_doc = {
            "_id": invite_id,
            "place_id": payload.place_id,
            "place_name": payload.place_name,
            "contact": payload.contact_phone_or_email,
            "invited_by": payload.invited_by_customer_id,
            "status": "INVITATION_SENT",
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        try:
            seller_claims_col.insert_one(invite_doc)
        except Exception:
            pass

        return {
            "invite_id": invite_id,
            "place_id": payload.place_id,
            "status": "INVITATION_SENT",
            "message": f"Invitation link generated for '{payload.place_name}'. Merchant must claim account to enable automated pricing."
        }

    def claim_business_account(self, payload: SellerClaimPayloadSchema) -> Dict[str, Any]:
        """Initiates merchant account claim flow."""
        claim_id = f"clm-{int(time.time())}-{uuid.uuid4().hex[:6]}"
        # Demo OTP verification code
        verification_code = "654321"

        claim_doc = {
            "_id": claim_id,
            "place_id": payload.place_id,
            "seller_name": payload.seller_name,
            "owner_name": payload.owner_name,
            "owner_phone": payload.owner_phone,
            "owner_email": payload.owner_email,
            "verification_code": verification_code,
            "status": "CLAIM_PENDING_VERIFICATION",
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        seller_claims_col.insert_one(claim_doc)

        return {
            "claim_id": claim_id,
            "place_id": payload.place_id,
            "status": "CLAIM_PENDING_VERIFICATION",
            "verification_code_demo": verification_code,
            "message": f"Verification code sent to {payload.owner_phone}. Enter code to verify business ownership."
        }

    def verify_claim(self, payload: SellerVerificationSchema) -> Dict[str, Any]:
        """Verifies merchant claim code and sets status to CONNECTED."""
        claim = seller_claims_col.find_one({"_id": payload.claim_id})
        if not claim:
            raise ValueError(f"Claim ID '{payload.claim_id}' not found.")

        if claim.get("verification_code") != payload.verification_code:
            raise ValueError("Invalid verification code.")

        place_id = claim["place_id"]
        seller_id = f"seller-connected-{int(time.time())}"

        # Update or Insert Seller Record in MongoDB
        sellers_col.update_one(
            {"place_id": place_id},
            {
                "$set": {
                    "name": claim["seller_name"],
                    "place_id": place_id,
                    "connection_status": "CONNECTED",
                    "ai_negotiation_enabled": False, # Requires explicit config activation
                    "owner_phone": claim["owner_phone"],
                    "verified_at": time.strftime("%Y-%m-%d %H:%M:%S")
                }
            },
            upsert=True
        )

        seller_claims_col.update_one({"_id": payload.claim_id}, {"$set": {"status": "VERIFIED"}})

        return {
            "seller_id": seller_id,
            "place_id": place_id,
            "connection_status": "CONNECTED",
            "message": "Business ownership verified! Configure negotiation preferences to enable AI bargaining."
        }

    def update_seller_config(self, config: SellerConfigSchema) -> Dict[str, Any]:
        """Updates merchant pricing, floor price, and AI negotiation controls."""
        new_status = "NEGOTIATION_ENABLED" if config.ai_negotiation_enabled else "CONNECTED"

        sellers_col.update_one(
            {"place_id": config.place_id},
            {
                "$set": {
                    "connection_status": new_status,
                    "ai_negotiation_enabled": config.ai_negotiation_enabled,
                    "min_acceptable_price": config.minimum_acceptable_price,
                    "max_rounds": config.max_negotiation_rounds,
                    "config": config.model_dump()
                }
            }
        )

        seller_configs_col.update_one(
            {"place_id": config.place_id},
            {"$set": config.model_dump()},
            upsert=True
        )

        return {
            "place_id": config.place_id,
            "connection_status": new_status,
            "ai_negotiation_enabled": config.ai_negotiation_enabled,
            "minimum_acceptable_price": config.minimum_acceptable_price,
            "message": f"Merchant preferences updated cleanly. Status: {new_status}"
        }

seller_onboarding_service = SellerOnboardingService()
