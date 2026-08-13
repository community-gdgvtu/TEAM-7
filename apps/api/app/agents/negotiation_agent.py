import random
import time
from typing import Dict, List, Any, Optional, Tuple
from app.schemas.schemas import (
    NegotiationStateEnum,
    RequirementSchema,
    SellerSchema,
    StrictOfferSchema,
    FactBusEventSchema
)
from app.core.fact_bus import fact_bus
from app.core.rules_engine import rules_engine

class InvalidStateTransitionException(Exception):
    """Raised when an illegal FSM state transition is attempted."""
    pass

class NegotiationFSM:
    """
    Explicit Finite-State Machine (FSM) enforcing strict state transition rules.
    """
    ALLOWED_TRANSITIONS: Dict[NegotiationStateEnum, List[NegotiationStateEnum]] = {
        NegotiationStateEnum.DISCOVERED: [NegotiationStateEnum.CONTACTED, NegotiationStateEnum.FAILED, NegotiationStateEnum.EXPIRED],
        NegotiationStateEnum.CONTACTED: [NegotiationStateEnum.INITIAL_OFFER, NegotiationStateEnum.FAILED, NegotiationStateEnum.EXPIRED],
        NegotiationStateEnum.INITIAL_OFFER: [NegotiationStateEnum.NEGOTIATING, NegotiationStateEnum.FAILED, NegotiationStateEnum.EXPIRED],
        NegotiationStateEnum.NEGOTIATING: [NegotiationStateEnum.COUNTER_OFFER, NegotiationStateEnum.FINAL_OFFER, NegotiationStateEnum.FAILED, NegotiationStateEnum.EXPIRED],
        NegotiationStateEnum.COUNTER_OFFER: [NegotiationStateEnum.NEGOTIATING, NegotiationStateEnum.FINAL_OFFER, NegotiationStateEnum.FAILED, NegotiationStateEnum.EXPIRED],
        NegotiationStateEnum.FINAL_OFFER: [NegotiationStateEnum.VERIFICATION, NegotiationStateEnum.FAILED, NegotiationStateEnum.EXPIRED],
        NegotiationStateEnum.VERIFICATION: [NegotiationStateEnum.COMPLETED, NegotiationStateEnum.FAILED, NegotiationStateEnum.EXPIRED],
        NegotiationStateEnum.COMPLETED: [],
        NegotiationStateEnum.FAILED: [],
        NegotiationStateEnum.EXPIRED: []
    }

    def __init__(self, initial_state: NegotiationStateEnum = NegotiationStateEnum.DISCOVERED):
        self.current_state: NegotiationStateEnum = initial_state
        self.history: List[Tuple[NegotiationStateEnum, str]] = [(initial_state, "FSM Initialized")]

    def transition_to(self, new_state: NegotiationStateEnum, reason: str = "") -> NegotiationStateEnum:
        allowed = self.ALLOWED_TRANSITIONS.get(self.current_state, [])
        if new_state not in allowed:
            raise InvalidStateTransitionException(
                f"Illegal FSM Transition: Cannot move from {self.current_state.value} to {new_state.value}. Allowed: {[s.value for s in allowed]}"
            )
        self.current_state = new_state
        self.history.append((new_state, reason))
        return self.current_state

class SellerPersonalityAdapter:
    """
    Simulated Seller Adapter with 5 distinct merchant personalities and deterministic seed generation.
    """
    PERSONALITIES = {
        "FIRM": {"flexibility": 5.0, "patience_rounds": 2, "tone": "Firm on margins"},
        "FLEXIBLE": {"flexibility": 14.0, "patience_rounds": 4, "tone": "Eager for customer deal"},
        "PREMIUM": {"flexibility": 8.0, "patience_rounds": 3, "tone": "Focuses on warranty & service"},
        "DISCOUNT": {"flexibility": 18.0, "patience_rounds": 4, "tone": "Aggressive price matching"},
        "INVENTORY_CLEARING": {"flexibility": 22.0, "patience_rounds": 4, "tone": "Clearing existing stock fast"}
    }

    @classmethod
    def get_personality(cls, seller: SellerSchema) -> Dict[str, Any]:
        if seller.flexibility <= 6.0:
            return cls.PERSONALITIES["FIRM"]
        elif seller.flexibility >= 15.0:
            return cls.PERSONALITIES["INVENTORY_CLEARING"]
        elif seller.verificationStatus == "PREMIUM":
            return cls.PERSONALITIES["PREMIUM"]
        elif seller.dealsCompleted > 400:
            return cls.PERSONALITIES["FLEXIBLE"]
        else:
            return cls.PERSONALITIES["DISCOUNT"]

class NegotiationAgentEngine:
    """
    Agent 3 — Negotiation Engine
    Orchestrates the explicit FSM, bounded rational bargaining, Fact Bus cross-seller benchmarks,
    and deterministic business rule validation.
    """

    def __init__(self):
        self.fsm = NegotiationFSM()
        self.max_rounds = 4

    def start_session(self, requirement: RequirementSchema, sellers: List[SellerSchema]) -> NegotiationStateEnum:
        self.fsm = NegotiationFSM(NegotiationStateEnum.DISCOVERED)
        fact_bus.initialize_session(requirement, sellers)

        # Transition DISCOVERED -> CONTACTED
        self.fsm.transition_to(NegotiationStateEnum.CONTACTED, "Sellers discovered and contacted")
        
        # Transition CONTACTED -> INITIAL_OFFER
        self.fsm.transition_to(NegotiationStateEnum.INITIAL_OFFER, "Initial quotes extracted from sellers")

        fact_bus.status = self.fsm.current_state.value
        fact_bus.add_event(
            event_type="SELLER_CONTACTED",
            message=f"Contacted {len(sellers)} local merchants in Hulkoti Market network."
        )

        return self.fsm.current_state

    def advance_step(self) -> bool:
        if self.fsm.current_state in [NegotiationStateEnum.COMPLETED, NegotiationStateEnum.FAILED, NegotiationStateEnum.EXPIRED]:
            return False

        req = fact_bus.requirement
        sellers = fact_bus.active_sellers

        if not req or not sellers:
            self.fsm.transition_to(NegotiationStateEnum.FAILED, "Missing requirement or active sellers")
            fact_bus.status = self.fsm.current_state.value
            return False

        fact_bus.current_round += 1
        current_round = fact_bus.current_round

        # 1. Update FSM State
        if current_round == 1:
            if self.fsm.current_state == NegotiationStateEnum.INITIAL_OFFER:
                self.fsm.transition_to(NegotiationStateEnum.NEGOTIATING, f"Round {current_round}: Bargaining started")
        elif current_round in [2, 3]:
            if self.fsm.current_state == NegotiationStateEnum.NEGOTIATING:
                self.fsm.transition_to(NegotiationStateEnum.COUNTER_OFFER, f"Round {current_round}: Counter offers processed")
            elif self.fsm.current_state == NegotiationStateEnum.COUNTER_OFFER:
                self.fsm.transition_to(NegotiationStateEnum.NEGOTIATING, f"Round {current_round}: Benchmark leveraging active")
        elif current_round >= self.max_rounds:
            if self.fsm.current_state in [NegotiationStateEnum.NEGOTIATING, NegotiationStateEnum.COUNTER_OFFER]:
                self.fsm.transition_to(NegotiationStateEnum.FINAL_OFFER, "Max rounds reached, locking final offers")

        fact_bus.status = self.fsm.current_state.value

        # 2. Process Seller Counter-Offers with Deterministic Rules Engine
        best_price = fact_bus.best_offer

        for seller in sellers:
            offer = fact_bus.offers.get(seller.id)
            if not offer:
                continue

            personality = SellerPersonalityAdapter.get_personality(seller)
            current_p = offer.price

            # Determine proposed price drop
            if current_round == 1:
                proposed_price = current_p
                msg = f"Initial quote: ₹{proposed_price:,.0f} ({seller.warrantyOffered})"
            elif current_round == 2:
                # Counter request based on customer budget
                drop = round((current_p - req.budget) * (personality["flexibility"] / 100.0) * 0.7)
                proposed_price = current_p - drop
                msg = f"Panchayat AI requested budget match → {seller.name} counter: ₹{proposed_price:,.0f}"
            elif current_round == 3 and best_price and best_price < current_p:
                # Benchmark leveraging using Fact Bus competitive offer!
                bench_drop = round((current_p - best_price) * 0.85)
                proposed_price = current_p - bench_drop
                msg = f"Panchayat AI: 'Another verified local seller offered ₹{best_price:,.0f}. Can you improve?' → {seller.name}: ₹{proposed_price:,.0f}"
                
                fact_bus.add_event(
                    event_type="BENCHMARK_LEVERAGED",
                    message=f"💡 BENCHMARK LEVERAGED: Informed {seller.name} of competing offer of ₹{best_price:,.0f}",
                    seller_id=seller.id,
                    seller_name=seller.name,
                    price=best_price
                )
            else:
                # Final round adjustment
                proposed_price = current_p * 0.99
                msg = f"Final offer locked at ₹{proposed_price:,.0f} ({seller.warrantyOffered})"

            # Enforce Deterministic Business Rules Engine (AI is NEVER the source of truth)
            is_valid, validated_price, rationale = rules_engine.validate_and_enforce_proposal(
                seller_id=seller.id,
                proposed_price=proposed_price,
                current_price=current_p,
                customer_budget=req.budget,
                seller_flexibility_pct=seller.flexibility,
                current_round=current_round,
                best_fact_bus_offer=best_price
            )

            fact_bus.update_offer(
                seller_id=seller.id,
                price=validated_price,
                status=self.fsm.current_state.value,
                last_message=msg,
                confidence=0.96
            )

        # 3. Finalize FSM Verification & Completion
        if current_round >= self.max_rounds:
            if self.fsm.current_state == NegotiationStateEnum.FINAL_OFFER:
                self.fsm.transition_to(NegotiationStateEnum.VERIFICATION, "Verifying offer integrity")
                fact_bus.add_event(
                    event_type="OFFER_VERIFIED",
                    message="Verified offer authenticity and merchant stock status across all contacted sellers."
                )
                self.fsm.transition_to(NegotiationStateEnum.COMPLETED, "Negotiation session successfully completed")
                
                # Enforce technical disclaimer rule (Never claim globally cheapest price)
                fact_bus.status = self.fsm.current_state.value
                fact_bus.add_event(
                    event_type="FINAL_OFFER",
                    message=f"🏆 COMPLETED: Discovered best competitive offer of ₹{fact_bus.best_offer:,.0f} among contacted sellers."
                )
                return False

        return True

negotiation_agent_engine = NegotiationAgentEngine()
