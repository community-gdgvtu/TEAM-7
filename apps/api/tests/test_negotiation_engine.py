import sys
import os
import unittest
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.agents.negotiation_agent import (
    NegotiationFSM,
    NegotiationStateEnum,
    InvalidStateTransitionException,
    SellerPersonalityAdapter,
    negotiation_agent_engine
)
from app.schemas.schemas import RequirementSchema, SellerSchema

class TestNegotiationEngine(unittest.TestCase):

    def test_valid_fsm_transitions(self):
        fsm = NegotiationFSM(NegotiationStateEnum.DISCOVERED)
        self.assertEqual(fsm.current_state, NegotiationStateEnum.DISCOVERED)

        # DISCOVERED -> CONTACTED
        fsm.transition_to(NegotiationStateEnum.CONTACTED)
        self.assertEqual(fsm.current_state, NegotiationStateEnum.CONTACTED)

        # CONTACTED -> INITIAL_OFFER
        fsm.transition_to(NegotiationStateEnum.INITIAL_OFFER)
        self.assertEqual(fsm.current_state, NegotiationStateEnum.INITIAL_OFFER)

        # INITIAL_OFFER -> NEGOTIATING
        fsm.transition_to(NegotiationStateEnum.NEGOTIATING)
        self.assertEqual(fsm.current_state, NegotiationStateEnum.NEGOTIATING)

        # NEGOTIATING -> COUNTER_OFFER
        fsm.transition_to(NegotiationStateEnum.COUNTER_OFFER)
        self.assertEqual(fsm.current_state, NegotiationStateEnum.COUNTER_OFFER)

        # COUNTER_OFFER -> FINAL_OFFER
        fsm.transition_to(NegotiationStateEnum.FINAL_OFFER)
        self.assertEqual(fsm.current_state, NegotiationStateEnum.FINAL_OFFER)

        # FINAL_OFFER -> VERIFICATION
        fsm.transition_to(NegotiationStateEnum.VERIFICATION)
        self.assertEqual(fsm.current_state, NegotiationStateEnum.VERIFICATION)

        # VERIFICATION -> COMPLETED
        fsm.transition_to(NegotiationStateEnum.COMPLETED)
        self.assertEqual(fsm.current_state, NegotiationStateEnum.COMPLETED)

    def test_invalid_fsm_transition_rejection(self):
        fsm = NegotiationFSM(NegotiationStateEnum.DISCOVERED)

        # DISCOVERED directly to COMPLETED (Illegal Transition!)
        with self.assertRaises(InvalidStateTransitionException):
            fsm.transition_to(NegotiationStateEnum.COMPLETED)

        # DISCOVERED directly to FINAL_OFFER (Illegal Transition!)
        with self.assertRaises(InvalidStateTransitionException):
            fsm.transition_to(NegotiationStateEnum.FINAL_OFFER)

    def test_seller_personalities(self):
        seller_firm = SellerSchema(
            id="s-firm", name="Firm Shop", category="Computers", location="Hulkoti", address="Address",
            distanceKm=1.0, rating=4.5, verificationStatus="VERIFIED", responseRate=90, tenureYears=5,
            dealsCompleted=100, basePriceMultiplier=1.1, flexibility=5.0, warrantyOffered="1 Year",
            stockStatus="IN_STOCK", deliveryOffered=True, phone="+91 98000 00000"
        )
        p_firm = SellerPersonalityAdapter.get_personality(seller_firm)
        self.assertEqual(p_firm["flexibility"], 5.0)

        seller_inventory = SellerSchema(
            id="s-inv", name="Clearance Shop", category="Computers", location="Hulkoti", address="Address",
            distanceKm=1.0, rating=4.5, verificationStatus="VERIFIED", responseRate=90, tenureYears=5,
            dealsCompleted=100, basePriceMultiplier=1.1, flexibility=18.0, warrantyOffered="1 Year",
            stockStatus="IN_STOCK", deliveryOffered=True, phone="+91 98000 00000"
        )
        p_inv = SellerPersonalityAdapter.get_personality(seller_inventory)
        self.assertEqual(p_inv["flexibility"], 22.0)

    def test_full_negotiation_simulation_lifecycle(self):
        req = RequirementSchema(
            product="Coding Laptop", category="Computers", budget=60000.0, location="Hulkoti Market"
        )
        sellers = [
            SellerSchema(
                id="seller-1", name="Sri Lakshmi Electronics", category="Computers", location="Hulkoti",
                address="Main Road", distanceKm=0.8, rating=4.8, verificationStatus="VERIFIED",
                responseRate=98, tenureYears=7, dealsCompleted=400, basePriceMultiplier=1.08,
                flexibility=12.0, warrantyOffered="1 Year Brand", stockStatus="IN_STOCK",
                deliveryOffered=True, phone="+91 98452 11092"
            )
        ]

        state = negotiation_agent_engine.start_session(req, sellers)
        self.assertEqual(state, NegotiationStateEnum.INITIAL_OFFER)

        # Advance rounds until completion
        steps = 0
        while negotiation_agent_engine.advance_step():
            steps += 1
            self.assertLessEqual(steps, 10)

        self.assertEqual(negotiation_agent_engine.fsm.current_state, NegotiationStateEnum.COMPLETED)

if __name__ == '__main__':
    unittest.main()
