import sys
import os
import unittest
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.agents.deal_intelligence_agent import deal_intelligence_agent
from app.core.fact_bus import fact_bus
from app.schemas.schemas import RequirementSchema, SellerSchema

class TestDealIntelligenceAgent(unittest.TestCase):

    def setUp(self):
        self.req = RequirementSchema(
            product="Coding Laptop", category="Computers", budget=60000.0, location="Hulkoti Market"
        )
        self.seller_a = SellerSchema(
            id="seller-a", name="Discount Hub", category="Computers", location="Hulkoti", address="Address",
            distanceKm=4.0, rating=4.0, verificationStatus="VERIFIED", responseRate=80, tenureYears=2,
            dealsCompleted=50, basePriceMultiplier=1.0, flexibility=5.0, warrantyOffered="No Warranty",
            stockStatus="LIMITED", deliveryOffered=False, phone="+91 98000 00001"
        )
        self.seller_b = SellerSchema(
            id="seller-b", name="Sri Lakshmi Electronics", category="Computers", location="Hulkoti", address="Main Rd",
            distanceKm=0.5, rating=4.9, verificationStatus="PREMIUM", responseRate=99, tenureYears=8,
            dealsCompleted=500, basePriceMultiplier=1.05, flexibility=12.0, warrantyOffered="1 Year Brand Warranty",
            stockStatus="IN_STOCK", deliveryOffered=True, phone="+91 98000 00002"
        )

    def test_multi_factor_scoring_and_tradeoffs(self):
        fact_bus.initialize_session(self.req, [self.seller_a, self.seller_b])

        # Seller A offers ₹57,000 (lower raw price, no warranty, 4 km away)
        # Seller B offers ₹58,000 (₹1,000 higher price, 1 Yr warranty, 0.5 km away, 4.9⭐)
        fact_bus.update_offer("seller-a", 57000.0, "FINAL_OFFER", "Final quote ₹57,000")
        fact_bus.update_offer("seller-b", 58000.0, "FINAL_OFFER", "Final quote ₹58,000 with 1 Year Warranty")

        recs = deal_intelligence_agent.calculate_deal_recommendations()

        self.assertIsNotNone(recs.recommended_deal)
        self.assertEqual(len(recs.ranked_offers), 2)

        # Seller B should be recommended despite ₹1,000 higher raw price!
        top_deal = recs.recommended_deal
        self.assertEqual(top_deal.seller_id, "seller-b")
        self.assertTrue(top_deal.is_recommended)
        self.assertIn("recommended despite not having the lowest raw price", top_deal.explanation)
        self.assertGreater(len(top_deal.trade_offs), 0)

    def test_reproducibility_from_stored_snapshot(self):
        snapshot = {
            "sessionId": "PB-TEST-1234",
            "requirement": {"budget": 60000.0},
            "highestInitialQuote": 64000.0,
            "bestOffer": 58000.0,
            "offers": {
                "seller-b": {
                    "seller_id": "seller-b",
                    "seller_name": "Sri Lakshmi Electronics",
                    "price": 58000.0,
                    "warranty": "1 Year Brand Warranty",
                    "availability": "IN_STOCK",
                    "confidence": 0.96
                }
            },
            "activeSellers": [
                {
                    "id": "seller-b",
                    "name": "Sri Lakshmi Electronics",
                    "distanceKm": 0.5,
                    "rating": 4.9,
                    "responseRate": 99
                }
            ]
        }

        rec1 = deal_intelligence_agent.calculate_deal_recommendations(snapshot)
        rec2 = deal_intelligence_agent.calculate_deal_recommendations(snapshot)

        self.assertEqual(rec1.recommended_deal.seller_id, rec2.recommended_deal.seller_id)
        self.assertEqual(rec1.recommended_deal.total_score, rec2.recommended_deal.total_score)

if __name__ == '__main__':
    unittest.main()
