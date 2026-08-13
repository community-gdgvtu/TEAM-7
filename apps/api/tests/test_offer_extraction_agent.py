import sys
import os
import unittest
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.agents.offer_extraction_agent import offer_extraction_agent

class TestOfferExtractionAgent(unittest.TestCase):

    def test_example_input_extraction(self):
        text = "I can give you the laptop for 59,500, one year warranty included, but pickup is from our store."
        extracted = offer_extraction_agent.extract_from_text(text)

        self.assertEqual(extracted.price, 59500.0)
        self.assertEqual(extracted.product, "laptop")
        self.assertEqual(extracted.warranty, "1 Year Brand Warranty")
        self.assertEqual(extracted.delivery, "STORE_PICKUP")
        self.assertEqual(extracted.original_seller_message, text)
        self.assertGreaterEqual(extracted.confidence, 0.90)
        self.assertFalse(extracted.has_ambiguous_price)

    def test_hindi_hinglish_extraction(self):
        text = "Bhai 58,500 me mil jayega, GST bill aur sealed box ke saath, dukan se aakar le lo."
        extracted = offer_extraction_agent.extract_from_text(text)

        self.assertEqual(extracted.price, 58500.0)
        self.assertIn("GST Invoice", extracted.conditions)
        self.assertIn("Sealed Packaging", extracted.conditions)
        self.assertEqual(extracted.delivery, "STORE_PICKUP")

    def test_kannada_kanglish_extraction(self):
        text = "Nimage laptop 59000 rs ge kodthini, 1 year warranty ide, store pickup iruthe."
        extracted = offer_extraction_agent.extract_from_text(text)

        self.assertEqual(extracted.price, 59000.0)
        self.assertEqual(extracted.product, "laptop")
        self.assertEqual(extracted.warranty, "1 Year Brand Warranty")

    def test_ambiguous_price_and_incomplete_response(self):
        text = "Call our store for best price and discount."
        extracted = offer_extraction_agent.extract_from_text(text)

        self.assertIsNone(extracted.price)
        self.assertTrue(extracted.has_ambiguous_price)
        self.assertLessEqual(extracted.confidence, 0.50)

    def test_unspecified_fields_are_none(self):
        text = "We have phone for 18000."
        extracted = offer_extraction_agent.extract_from_text(text)

        self.assertEqual(extracted.price, 18000.0)
        self.assertEqual(extracted.product, "phone")
        # Unspecified fields must remain None, not hallucinated!
        self.assertIsNone(extracted.warranty)
        self.assertIsNone(extracted.delivery)
        self.assertIsNone(extracted.validity)
        self.assertIsNone(extracted.quantity)

if __name__ == '__main__':
    unittest.main()
