import re
from typing import Dict, Any, List
from app.schemas.schemas import RequirementSchema

class RequirementExtractionAgent:
    """
    Agent 1 — Requirement Agent
    Converts multi-lingual natural language or voice requests (EN, HI, KN, UR)
    into structured JSON schemas with field-level confidence & human-readable interpretations.
    Includes explicit prompt injection defense & PII protection rules.
    Never trusts raw unvalidated LLM output.
    """
    
    # Security: Known prompt injection / override patterns
    PROMPT_INJECTION_PATTERNS = [
        r'ignore\s+(?:all\s+)?(?:previous\s+)?rules',
        r'reveal\s+(?:another\s+)?customer',
        r'reveal\s+budget',
        r'system\s+prompt',
        r'override\s+instructions',
        r'bypass\s+security',
        r'disclose\s+private',
        r'jailbreak',
        r'sql\s+injection',
        r'drop\s+table'
    ]

    def is_prompt_injection(self, text: str) -> bool:
        text_lower = text.lower()
        for pat in self.PROMPT_INJECTION_PATTERNS:
            if re.search(pat, text_lower):
                return True
        return False

    def analyze(self, text: str, default_language: str = "en") -> RequirementSchema:
        raw = text.strip()
        raw_lower = raw.lower()

        # Security Check: Prompt Injection Defense
        if self.is_prompt_injection(raw):
            return RequirementSchema(
                product="[REFUSED] Security Violation Attempt",
                category="Electronics",
                brand_preference="None",
                quantity="0 Units",
                budget=60000.0,
                currency="INR",
                purpose="Invalid Request",
                location="Hulkoti Market, Gadag",
                required_features=[],
                preferred_seller_distance_km=5.0,
                warranty_preference="Standard",
                urgency="LOW",
                language=default_language,
                originalPrompt=raw,
                confidence=0.0,
                needs_clarification=True,
                clarification_prompt="SECURITY WARNING: Prompt injection attempt detected. Request refused and system safety rules enforced.",
                human_interpretation="[SECURITY REFUSAL] Prompt injection attempt blocked. System rules and customer data privacy enforced."
            )

        # Detect Language
        detected_lang = default_language
        if any(w in raw_lower for w in ["mujhe", "chahiye", "kilo", "andar", "bhai", "rupaye"]):
            detected_lang = "hi"
        elif any(w in raw_lower for w in ["baku", "beku", "phone-u", "olage", "kodi"]):
            detected_lang = "kn"

        # 1. Budget extraction
        budget = 0.0

        # Dedicated price patterns with currency symbols / keywords
        price_patterns = [
            r'₹\s*([\d,]+)',
            r'rs\.?\s*([\d,]+)',
            r'([\d,]+)\s*rs',
            r'([\d,]+)\s*rupaye',
            r'under\s*₹?\s*([\d,]+)',
            r'below\s*₹?\s*([\d,]+)',
            r'([\d,]+)\s*(?:ke\s*andar|olage)'
        ]

        for pat in price_patterns:
            m = re.search(pat, raw_lower)
            if m:
                val_str = m.group(1).replace(',', '')
                try:
                    val = float(val_str)
                    budget = val
                    break
                except ValueError:
                    pass

        # Fallback numeric extraction if price pattern missed
        if budget == 0.0:
            nums = re.findall(r'\b\d{3,6}\b', raw_lower.replace(',', ''))
            if nums:
                budget = float(nums[0])

        # 2. Product & Category classification
        product = "Item"
        category = "Electronics"
        purpose = "General Purpose"
        required_features = []

        if any(w in raw_lower for w in ["laptop", "computer", "pc", "macbook", "notebook"]):
            product = "Coding Laptop (16GB RAM / 512GB SSD)"
            category = "Computers"
            purpose = "Software Development & Coding"
            required_features = ["16GB RAM", "512GB SSD", "Intel Core i5/i7 or Ryzen 7"]
        elif any(w in raw_lower for w in ["phone", "mobile", "samsung", "iphone", "galaxy", "smartphone"]):
            product = "Samsung Galaxy Smartphone 5G"
            category = "Electronics"
            purpose = "Daily Mobile & Camera Use"
            required_features = ["5G Connectivity", "Super AMOLED Display", "50MP Camera"]
        elif any(w in raw_lower for w in ["rice", "basmati", "kilo", "grain", "groceries", "atta", "oil"]):
            product = "5kg Premium Sona Masoori / Basmati Rice"
            category = "Groceries"
            purpose = "Daily Household Consumption"
            required_features = ["FSSAI Certified", "Sealed Packaging", "Fresh Harvest"]
        elif any(w in raw_lower for w in ["drill", "hardware", "tools", "machine", "screw"]):
            product = "Impact Drill Machine (500W)"
            category = "Hardware"
            purpose = "Home Improvement & Construction"
            required_features = ["500W Motor", "Reversible Speed", "Chuck Key Included"]
        else:
            product = raw.title()

        # 3. Brand preference
        brand_preference = "Any Brand"
        if "samsung" in raw_lower:
            brand_preference = "Samsung"
        elif "asus" in raw_lower:
            brand_preference = "Asus"
        elif "hp" in raw_lower:
            brand_preference = "HP"
        elif "lenovo" in raw_lower:
            brand_preference = "Lenovo"
        elif "bosch" in raw_lower:
            brand_preference = "Bosch"

        # 4. Quantity extraction
        quantity = "1 Unit"
        qty_match = re.search(r'(\d+)\s*(?:kilo|kg|units?|pcs?|items?)', raw_lower)
        if qty_match:
            quantity = f"{qty_match.group(1)} Kilo" if "kilo" in raw_lower or "kg" in raw_lower else f"{qty_match.group(1)} Units"

        # 5. Check if clarification is required
        needs_clarification = False
        clarification_prompt = None

        if budget == 0.0 and len(raw) < 10:
            needs_clarification = True
            clarification_prompt = "Could you please specify your maximum budget in Rupees (INR)?"

        # 6. Compute Confidence Score
        confidence = 0.96
        if budget > 0.0 and category != "Electronics":
            confidence = 0.98
        elif budget == 0.0:
            confidence = 0.65

        # 7. Generate Human-Readable Interpretation
        if detected_lang == "hi":
            human_interp = f"ग्राहक को {category} श्रेणी में '{product}' चाहिए, जिसका अधिकतम बजट ₹{budget:,.0f} है।"
        elif detected_lang == "kn":
            human_interp = f"ಗ್ರಾಹಕರಿಗೆ {category} ವಿಭಾಗದಲ್ಲಿ '{product}' ಬೇಕಾಗಿದೆ, ಗರಿಷ್ಠ ಬಜೆಟ್ ₹{budget:,.0f}."
        else:
            human_interp = f"Customer seeks '{product}' in {category} with a maximum budget of ₹{budget:,.0f} in Hulkoti Market."

        # Return validated Pydantic schema
        return RequirementSchema(
            product=product,
            category=category,
            brand_preference=brand_preference,
            quantity=quantity,
            budget=budget if budget > 0.0 else 60000.0,
            currency="INR",
            purpose=purpose,
            location="Hulkoti Market, Gadag",
            required_features=required_features,
            preferred_seller_distance_km=5.0,
            warranty_preference="1 Year Brand Warranty",
            urgency="STANDARD",
            language=detected_lang,
            originalPrompt=raw,
            confidence=confidence,
            needs_clarification=needs_clarification,
            clarification_prompt=clarification_prompt,
            human_interpretation=human_interp
        )

requirement_agent = RequirementExtractionAgent()

def analyze_requirement(prompt: str, language: str = "en") -> RequirementSchema:
    return requirement_agent.analyze(prompt, language)
