import sys
import os
import unittest
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.agents.requirement_agent import requirement_agent

class TestRequirementAgent(unittest.TestCase):

    def test_english_laptop_prompt(self):
        prompt = "I need a laptop for coding under ₹60,000."
        req = requirement_agent.analyze(prompt, "en")

        self.assertEqual(req.category, "Computers")
        self.assertIn("Laptop", req.product)
        self.assertEqual(req.budget, 60000.0)
        self.assertEqual(req.currency, "INR")
        self.assertEqual(req.language, "en")
        self.assertGreaterEqual(req.confidence, 0.90)
        self.assertIn("laptop", req.human_interpretation.lower())
        self.assertFalse(req.needs_clarification)

    def test_hindi_hinglish_rice_prompt(self):
        prompt = "Mujhe 5 kilo basmati rice ₹500 ke andar chahiye."
        req = requirement_agent.analyze(prompt, "hi")

        self.assertEqual(req.category, "Groceries")
        self.assertEqual(req.budget, 500.0)
        self.assertIn("Kilo", req.quantity)
        self.assertEqual(req.language, "hi")
        self.assertGreaterEqual(req.confidence, 0.90)
        self.assertIn("500", req.human_interpretation)

    def test_kannada_kanglish_phone_prompt(self):
        prompt = "Kannada voice input requesting a phone under ₹20,000."
        req = requirement_agent.analyze(prompt, "kn")

        self.assertEqual(req.category, "Electronics")
        self.assertEqual(req.budget, 20000.0)
        self.assertGreaterEqual(req.confidence, 0.90)

    def test_ambiguous_short_prompt(self):
        prompt = "laptop"
        req = requirement_agent.analyze(prompt, "en")

        self.assertEqual(req.category, "Computers")
        self.assertTrue(req.needs_clarification)
        self.assertIsNotNone(req.clarification_prompt)

if __name__ == '__main__':
    unittest.main()
