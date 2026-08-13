import sys
import os
import unittest
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.fact_bus import fact_bus
from app.schemas.schemas import RequirementSchema, SellerSchema

class TestFactBusArchitecture(unittest.TestCase):

    def setUp(self):
        self.req = RequirementSchema(
            product="Coding Laptop", category="Computers", budget=60000.0, location="Hulkoti Market"
        )
        self.sellers = [
            SellerSchema(
                id="seller-1", name="Sri Lakshmi Electronics", category="Computers", location="Hulkoti",
                address="Main Road", distanceKm=0.8, rating=4.8, verificationStatus="VERIFIED",
                responseRate=98, tenureYears=7, dealsCompleted=400, basePriceMultiplier=1.08,
                flexibility=12.0, warrantyOffered="1 Year Brand", stockStatus="IN_STOCK",
                deliveryOffered=True, phone="+91 98452 11092"
            )
        ]

    def test_immutable_event_logging(self):
        fact_bus.initialize_session(self.req, self.sellers)
        initial_event_count = len(fact_bus.events)

        self.assertGreater(initial_event_count, 0)
        self.assertEqual(fact_bus.events[-1].eventType, "SESSION_CREATED")

        # Record a new event
        evt = fact_bus.record_event(
            event_type="COUNTER_OFFER_RECEIVED",
            message="Seller counter received",
            seller_id="seller-1",
            price=59000.0
        )

        self.assertEqual(len(fact_bus.events), initial_event_count + 1)
        self.assertEqual(fact_bus.events[0].id, evt.id)
        self.assertEqual(fact_bus.events[0].eventType, "COUNTER_OFFER_RECEIVED")

    def test_materialized_session_state_and_best_offer(self):
        fact_bus.initialize_session(self.req, self.sellers)

        # Update offer for seller-1
        fact_bus.update_offer(
            seller_id="seller-1",
            price=58000.0,
            status="COUNTER_OFFER",
            last_message="Counter offer ₹58,000"
        )

        snapshot = fact_bus.to_dict()
        self.assertEqual(snapshot["bestOffer"], 58000.0)
        self.assertEqual(snapshot["bestSellerId"], "seller-1")
        self.assertEqual(snapshot["bestSellerName"], "Sri Lakshmi Electronics")
        self.assertGreater(snapshot["totalSavings"], 0)
        self.assertGreater(snapshot["savingsPercentage"], 0.0)

if __name__ == '__main__':
    unittest.main()
