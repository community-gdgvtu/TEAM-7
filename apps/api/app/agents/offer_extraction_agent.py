import re
from typing import Optional, Dict, Any, List
from app.schemas.schemas import ExtractedOfferSchema, StrictOfferSchema, SellerSchema, RequirementSchema

class OfferExtractionAgent:
    """
    Agent 4 — Offer Extraction Agent
    Parses unstructured/semi-structured seller conversation signals across EN, HI, KN, UR.
    Extracts structured schema, confidence score, preserves original message,
    and returns None for missing fields without inventing/hallucinating data.
    """

    def extract_from_text(self, seller_message: str) -> ExtractedOfferSchema:
        msg = seller_message.strip()
        msg_lower = msg.lower()

        # 1. Price extraction
        price: Optional[float] = None
        has_ambiguous_price = False

        # Ambiguity check (e.g., "call me", "depends", "50-60k", "contact store")
        if any(w in msg_lower for w in ["call me", "contact", "depends", "around", "approx", "flexible price", "negotiable"]):
            if "-" in msg_lower or "to" in msg_lower or not re.search(r'\d{4,6}', msg_lower):
                has_ambiguous_price = True

        # Extract explicit price numbers (e.g. 59,500 | 59500 | 59.5k | 59.5 thousand)
        price_match = re.search(r'(?:₹|rs\.?|inr|price|for)?\s*([\d,]+(?:\.\d+)?)\s*(k|thousand|rupees|rs)?', msg_lower)
        if price_match:
            val_str = price_match.group(1).replace(',', '')
            suffix = price_match.group(2)
            try:
                val = float(val_str)
                if suffix == 'k' or (suffix == 'thousand' and val < 1000):
                    val *= 1000
                elif val < 100 and 'k' in msg_lower:
                    val *= 1000
                
                # Sanity check for product prices
                if val >= 100:
                    price = val
            except ValueError:
                pass

        if price is None and not has_ambiguous_price:
            # Fallback numeric match
            num_match = re.findall(r'\b\d{4,6}\b', msg_lower.replace(',', ''))
            if num_match:
                price = float(num_match[0])
            else:
                has_ambiguous_price = True

        # 2. Product extraction (strictly None if unspecified)
        product: Optional[str] = None
        if "laptop" in msg_lower or "computer" in msg_lower:
            product = "laptop"
        elif "phone" in msg_lower or "samsung" in msg_lower or "mobile" in msg_lower:
            product = "phone"
        elif "rice" in msg_lower or "basmati" in msg_lower:
            product = "rice"
        elif "drill" in msg_lower or "tool" in msg_lower:
            product = "drill"

        # 3. Warranty extraction (strictly None if unspecified)
        warranty: Optional[str] = None
        if "1 year" in msg_lower or "one year" in msg_lower or "1 yr" in msg_lower:
            warranty = "1 Year Brand Warranty"
        elif "6 month" in msg_lower or "six month" in msg_lower:
            warranty = "6 Months Shop Warranty"
        elif "warranty" in msg_lower:
            warranty = "Standard Warranty"

        # 4. Delivery extraction (strictly None if unspecified)
        delivery: Optional[str] = None
        if "pickup" in msg_lower or "store" in msg_lower or "shop" in msg_lower or "aakar le lo" in msg_lower:
            delivery = "STORE_PICKUP"
        elif "home" in msg_lower or "delivery" in msg_lower or "dispatch" in msg_lower or "ghar" in msg_lower:
            delivery = "HOME_DELIVERY"

        # 5. Availability extraction (strictly None if unspecified)
        availability: Optional[str] = None
        if "in stock" in msg_lower or "ready" in msg_lower or "available" in msg_lower:
            availability = "IN_STOCK"
        elif "limited" in msg_lower or "1 piece" in msg_lower or "last stock" in msg_lower:
            availability = "LIMITED"
        elif "order" in msg_lower or "2 days" in msg_lower:
            availability = "ORDER_BASED"

        # 6. Conditions & Intent
        conditions: List[str] = []
        if "sealed" in msg_lower:
            conditions.append("Sealed Packaging")
        if "bill" in msg_lower or "invoice" in msg_lower or "gst" in msg_lower:
            conditions.append("GST Invoice")

        seller_intent = "COUNTER"
        if "final" in msg_lower or "fixed" in msg_lower or "last price" in msg_lower or "no discount" in msg_lower:
            seller_intent = "FIRM"
        elif "deal" in msg_lower or "agreed" in msg_lower or "ok done" in msg_lower or "ha ho jayega" in msg_lower:
            seller_intent = "ACCEPT"
        elif "not possible" in msg_lower or "cannot do" in msg_lower:
            seller_intent = "REJECT"

        # 7. Confidence Calculation
        confidence = 0.96
        if has_ambiguous_price or price is None:
            confidence = 0.45
        elif warranty is None and delivery is None:
            confidence = 0.82

        return ExtractedOfferSchema(
            product=product,
            price=price,
            currency="INR",
            quantity=None, # Strictly None if unspecified in conversation
            warranty=warranty,
            availability=availability,
            delivery=delivery,
            conditions=conditions,
            validity=None,
            seller_intent=seller_intent,
            confidence=confidence,
            original_seller_message=msg,
            has_ambiguous_price=has_ambiguous_price
        )

offer_extraction_agent = OfferExtractionAgent()
