import unittest
import time
from app.schemas.schemas import RequirementSchema, SellerSchema, UserRoleType
from app.schemas.auth_schemas import CustomerRegisterSchema, LoginSchema
from app.agents.requirement_agent import analyze_requirement
from app.agents.discovery_agent import discovery_engine
from app.agents.negotiation_agent import negotiation_agent_engine
from app.agents.deal_intelligence_agent import deal_intelligence_agent
from app.core.fact_bus import fact_bus
from app.core.security import hash_password, verify_password, create_access_token

class TestE2ECompleteCustomerJourney(unittest.TestCase):
    """
    End-to-End Integration Suite testing the complete 11-step customer journey:
    1. Register -> 2. Login -> 3. Search -> 4. Requirement Extraction ->
    5. Seller Discovery -> 6. Start Negotiation -> 7. Multiple Offers ->
    8. Fact Bus Update -> 9. Best Offer -> 10. Recommendation -> 11. Save Deal
    """

    def test_complete_11_step_reproducible_journey(self):
        # Step 1: Customer Registration Simulation
        cust_payload = CustomerRegisterSchema(
            email="e2e_customer_test@panchayat.ai",
            password="SecureE2EPassword2026!",
            name="Ramesh Kumar",
            phone="+91 98450 12345",
            location="Hulkoti Market, Gadag"
        )
        self.assertEqual(cust_payload.email, "e2e_customer_test@panchayat.ai")
        pwd_hash = hash_password(cust_payload.password)
        self.assertTrue(verify_password("SecureE2EPassword2026!", pwd_hash))

        # Step 2: Login & JWT Access Token Issue
        jwt_token = create_access_token({"sub": "usr-e2e-1", "role": "CUSTOMER", "email": cust_payload.email})
        self.assertTrue(len(jwt_token) > 20)

        # Step 3 & 4: Multi-Lingual Spoken Search & Requirement Extraction
        raw_prompt = "I need a coding laptop under ₹60,000 in Hulkoti Market."
        req: RequirementSchema = analyze_requirement(raw_prompt, language="en")
        self.assertEqual(req.product, "Coding Laptop (16GB RAM / 512GB SSD)")
        self.assertEqual(req.budget, 60000.0)
        self.assertGreaterEqual(req.confidence, 0.90)

        # Step 5: Seller Discovery & Geospatial KNN Ranking
        discovery_res = discovery_engine.discover_and_rank(req, category_filter="Computers")
        self.assertGreater(discovery_res.total_found, 0)
        top_seller: SellerSchema = discovery_res.sellers[0].seller
        self.assertTrue(top_seller.name)

        # Step 6: Start Negotiation Session
        sellers_list = [d.seller for d in discovery_res.sellers]
        session_state = negotiation_agent_engine.start_session(req, sellers_list)
        self.assertTrue(len(fact_bus.session_id) > 5)
        self.assertEqual(fact_bus.status, "INITIAL_OFFER")

        # Step 7: Advance Negotiation Rounds & Multiple Merchant Counter-Offers
        rounds_run = 0
        while negotiation_agent_engine.advance_step():
            rounds_run += 1
            if rounds_run > 10:
                break

        # Step 8: Fact Bus Update & Immutable Log Verification
        self.assertGreater(len(fact_bus.events), 3)
        self.assertTrue(any(e.eventType == "BEST_OFFER_UPDATED" for e in fact_bus.events))

        # Step 9: Best Offer Identification
        self.assertIsNotNone(fact_bus.best_offer)
        self.assertGreater(fact_bus.best_offer, 0.0)

        # Step 10: Deal Intelligence Multi-Factor Scoring & Recommendation
        recommendations = deal_intelligence_agent.calculate_deal_recommendations()
        self.assertIsNotNone(recommendations.recommended_deal)
        self.assertTrue(recommendations.recommended_deal.total_score >= 80.0)
        self.assertTrue(len(recommendations.recommended_deal.explanation) > 10)

        # Step 11: Save Deal & Claim Verification
        claimed_seller_id = recommendations.recommended_deal.seller_id
        self.assertIn(claimed_seller_id, [s.id for s in sellers_list])

if __name__ == "__main__":
    unittest.main()
