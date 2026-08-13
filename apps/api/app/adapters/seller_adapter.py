from abc import ABC, abstractmethod
from typing import Dict, Any, List
import time
from app.schemas.schemas import StrictOfferSchema, SellerSchema, RequirementSchema

class SellerAdapter(ABC):
    """
    Extensible Seller Communication Layer Abstraction
    Separates communication protocol (simulated, manual seller portal, or telephony/voice)
    from core negotiation logic.
    """
    @abstractmethod
    def get_initial_quote(self, session_id: str, seller: SellerSchema, requirement: RequirementSchema) -> StrictOfferSchema:
        pass

    @abstractmethod
    def process_counter_offer(self, session_id: str, seller: SellerSchema, requirement: RequirementSchema, current_offer: StrictOfferSchema, target_benchmark: float | None, round_num: int) -> StrictOfferSchema:
        pass

class SimulatedSellerAdapter(SellerAdapter):
    """
    Deterministic behavioral simulation adapter for Hackathon demo reliability.
    Explicitly tags offers with source = "SIMULATED".
    """
    def get_initial_quote(self, session_id: str, seller: SellerSchema, requirement: RequirementSchema) -> StrictOfferSchema:
        initial_price = round(requirement.budget * seller.basePriceMultiplier)
        now_str = time.strftime("%Y-%m-%d %H:%M:%S")

        return StrictOfferSchema(
            seller_id=seller.id,
            session_id=session_id,
            product_id=requirement.product,
            seller_name=seller.name,
            price=initial_price,
            initial_price=initial_price,
            currency="INR",
            timestamp=now_str,
            availability="IN_STOCK" if seller.stockStatus == "IN_STOCK" else "LIMITED",
            warranty=seller.warrantyOffered,
            conditions=["Sealed Box", "GST Invoice"],
            source="SIMULATED",
            verification_status="VERIFIED",
            confidence=0.94,
            negotiation_round=1,
            last_message=f"Quoted initial price of ₹{initial_price:,.0f}"
        )

    def process_counter_offer(self, session_id: str, seller: SellerSchema, requirement: RequirementSchema, current_offer: StrictOfferSchema, target_benchmark: float | None, round_num: int) -> StrictOfferSchema:
        target_budget = requirement.budget
        min_floor = round(target_budget * (1.0 - (seller.flexibility / 100.0)))
        now_str = time.strftime("%Y-%m-%d %H:%M:%S")

        new_price = current_offer.price
        message = ""

        if round_num == 2:
            drop = round((current_offer.price - target_budget) * 0.4)
            new_price = max(min_floor, current_offer.price - drop)
            message = f"Panchayat AI requested budget match. {seller.name} dropped price to ₹{new_price:,.0f}"
        elif round_num == 3:
            if target_benchmark and target_benchmark < current_offer.price:
                benchmark_drop = round((current_offer.price - target_benchmark) * 0.85)
                new_price = max(min_floor, current_offer.price - benchmark_drop)
                if new_price < target_benchmark:
                    message = f"Panchayat AI: 'Another verified seller offered ₹{target_benchmark:,.0f}. Can you beat it?' → {seller.name}: 'We can do ₹{new_price:,.0f}'"
                else:
                    new_price = max(min_floor, target_benchmark)
                    message = f"{seller.name} matched best market benchmark at ₹{new_price:,.0f}"
            else:
                new_price = max(min_floor, round(current_offer.price * 0.98))
                message = f"{seller.name} further discounted leading offer to ₹{new_price:,.0f}"
        else:
            new_price = max(min_floor, current_offer.price)
            message = f"Final offer locked at ₹{new_price:,.0f} (Verified with {seller.warrantyOffered})"

        return StrictOfferSchema(
            seller_id=seller.id,
            session_id=session_id,
            product_id=requirement.product,
            seller_name=seller.name,
            price=new_price,
            initial_price=current_offer.initial_price,
            currency="INR",
            timestamp=now_str,
            availability=current_offer.availability,
            warranty=seller.warrantyOffered,
            conditions=current_offer.conditions,
            source="SIMULATED",
            verification_status="VERIFIED",
            confidence=0.96,
            negotiation_round=round_num,
            last_message=message
        )

class ManualSellerAdapter(SellerAdapter):
    """
    Adapter for direct merchant interaction via Seller Portal dashboard.
    Tags offers with source = "MANUAL_SELLER".
    """
    def get_initial_quote(self, session_id: str, seller: SellerSchema, requirement: RequirementSchema) -> StrictOfferSchema:
        initial_price = round(requirement.budget * seller.basePriceMultiplier)
        return StrictOfferSchema(
            seller_id=seller.id,
            session_id=session_id,
            product_id=requirement.product,
            seller_name=seller.name,
            price=initial_price,
            initial_price=initial_price,
            currency="INR",
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
            availability="IN_STOCK",
            warranty=seller.warrantyOffered,
            conditions=["Merchant Portal Verified"],
            source="MANUAL_SELLER",
            verification_status="VERIFIED",
            confidence=0.98,
            negotiation_round=1,
            last_message="Initial quote registered by merchant portal"
        )

    def process_counter_offer(self, session_id: str, seller: SellerSchema, requirement: RequirementSchema, current_offer: StrictOfferSchema, target_benchmark: float | None, round_num: int) -> StrictOfferSchema:
        return current_offer

class FutureVoiceSellerAdapter(SellerAdapter):
    """
    Extensible stub for future Twilio / Telephony real-time voice call integration.
    Tags offers with source = "VOICE_ADAPTER".
    """
    def get_initial_quote(self, session_id: str, seller: SellerSchema, requirement: RequirementSchema) -> StrictOfferSchema:
        raise NotImplementedError("Telephony voice calls are disabled in demo mode. Using SimulatedSellerAdapter.")

    def process_counter_offer(self, session_id: str, seller: SellerSchema, requirement: RequirementSchema, current_offer: StrictOfferSchema, target_benchmark: float | None, round_num: int) -> StrictOfferSchema:
        raise NotImplementedError("Telephony voice calls are disabled in demo mode.")

simulated_seller_adapter = SimulatedSellerAdapter()
manual_seller_adapter = ManualSellerAdapter()
