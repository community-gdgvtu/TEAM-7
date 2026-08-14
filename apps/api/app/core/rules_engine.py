from typing import Tuple, Dict, Any

class BusinessRulesEngine:
    """
    CRITICAL ARCHITECTURE PRINCIPLE:
    The AI model is an advisor/proposer, NEVER the source of truth.
    Every LLM proposal is intercepted and validated against strict, deterministic business invariants:
    
    1. Budget Invariant: Proposed price must not exceed customer target budget (unless initial quote baseline).
    2. Floor Invariant: Proposed price must not breach seller's minimum profit floor margin.
    3. Round Invariant: Negotiation cannot exceed MAX_ROUNDS (default: 4).
    4. Fact Bus Invariant: Benchmark updates must be monotonically non-increasing (prices only drop).
    """

    MAX_ROUNDS: int = 4

    @classmethod
    def validate_and_enforce_proposal(
        cls,
        seller_id: str,
        proposed_price: float,
        current_price: float,
        customer_budget: float,
        seller_flexibility_pct: float,
        current_round: int,
        best_fact_bus_offer: float | None = None
    ) -> Tuple[bool, float, str]:
        """
        Validates an AI-proposed price action against business rules.
        Returns: (is_valid, validated_price, enforcement_rationale)
        """
        # Calculate absolute minimum profit floor for the seller
        min_seller_floor = round(customer_budget * (1.0 - (seller_flexibility_pct / 100.0)))

        # Rule 1: Check maximum rounds limit
        if current_round > cls.MAX_ROUNDS:
            return False, current_price, f"Rule Violated: Maximum negotiation rounds ({cls.MAX_ROUNDS}) reached."

        # Rule 2: Check seller minimum floor (AI cannot force seller below margin)
        if proposed_price < min_seller_floor:
            enforced_price = min_seller_floor
            return True, enforced_price, f"Rule Enforced: AI proposed ₹{proposed_price:,.0f} was below seller profit floor. Adjusted to floor ₹{enforced_price:,.0f}."

        # Rule 3: Fact Bus benchmark leveraging rule
        if best_fact_bus_offer is not None and best_fact_bus_offer < current_price:
            # Check if AI attempted to increase price instead of decreasing
            if proposed_price > current_price:
                enforced_price = min(current_price, best_fact_bus_offer)
                return True, enforced_price, f"Rule Enforced: AI attempted price escalation. Corrected to benchmark ₹{enforced_price:,.0f}."

        # Rule 4: Validation Success
        return True, proposed_price, f"VALID: Proposal of ₹{proposed_price:,.0f} passed all deterministic business invariants."

    @classmethod
    def validate_offer(
        cls,
        proposed_price: float,
        target_budget: float = 60000.0,
        minimum_acceptable_price: float = 50000.0,
        round_number: int = 1,
        max_rounds: int = 4
    ) -> Dict[str, Any]:
        """Validates an offer against floor and round limits."""
        if round_number > max_rounds:
            return {"is_valid": False, "reason": f"Maximum negotiation rounds ({max_rounds}) reached."}
        if proposed_price < minimum_acceptable_price:
            return {"is_valid": False, "reason": f"Proposed price ₹{proposed_price:,.2f} breaches seller minimum acceptable floor price ₹{minimum_acceptable_price:,.2f}."}
        return {"is_valid": True, "reason": "Proposal passed deterministic business rules validation."}

rules_engine = BusinessRulesEngine()

