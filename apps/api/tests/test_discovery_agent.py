import sys
import os
import unittest
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.agents.discovery_agent import discovery_engine, calculate_haversine_distance
from app.schemas.schemas import RequirementSchema

class TestSellerDiscoveryEngine(unittest.TestCase):

    def setUp(self):
        self.requirement = RequirementSchema(
            product="Coding Laptop",
            category="Computers",
            quantity="1 Unit",
            budget=60000.0,
            location="Hulkoti Market, Gadag"
        )

    def test_discovery_scoring_and_ranking(self):
        res = discovery_engine.discover_and_rank(self.requirement)

        self.assertGreater(res.total_found, 0)
        self.assertLessEqual(len(res.sellers), 10)

        top = res.sellers[0]
        self.assertIsNotNone(top.seller.id)
        self.assertGreaterEqual(top.match_score, 70.0)
        self.assertLessEqual(top.match_score, 100.0)
        self.assertIn("Hulkoti", top.seller.location)
        self.assertIn("Ranked", top.explanation)

    def test_category_filtering(self):
        res_comp = discovery_engine.discover_and_rank(self.requirement, category_filter="Computers")
        for s in res_comp.sellers:
            self.assertEqual(s.seller.category, "Computers")

        res_groc = discovery_engine.discover_and_rank(self.requirement, category_filter="Groceries")
        for s in res_groc.sellers:
            self.assertEqual(s.seller.category, "Groceries")

    def test_haversine_distance_computation(self):
        # Hulkoti Market (15.4328, 75.6318) to Station Road Gadag (15.4350, 75.6350)
        dist = calculate_haversine_distance(15.4328, 75.6318, 15.4350, 75.6350)
        self.assertGreater(dist, 0.1)
        self.assertLess(dist, 5.0)

    def test_sorting_by_distance(self):
        res = discovery_engine.discover_and_rank(self.requirement, sort_by="distance")
        if len(res.sellers) > 1:
            self.assertLessEqual(res.sellers[0].distance_km, res.sellers[1].distance_km)

if __name__ == '__main__':
    unittest.main()
