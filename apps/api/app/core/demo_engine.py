import time
from typing import Dict, Any, List
from app.schemas.schemas import RequirementSchema, SellerSchema, FactBusEventSchema
from app.core.fact_bus import fact_bus

class DeterministicDemoEngine:
    """
    Deterministic Demo Engine for Panchayat AI.
    Executes the exact 4-seller negotiation benchmark scenario reproducibly:
    - Customer: 'I need a laptop for coding under ₹60,000'
    - Seller A (Sri Lakshmi): ₹65,000 -> ₹61,500
    - Seller B (Gadag Digital): ₹63,000 -> ₹59,500
    - Seller C (Panchayat Tech Plaza): ₹62,000 -> ₹58,900 (RECOMMENDED WINNER)
    - Seller D (Hulkoti Laptop Zone): ₹66,000 -> ₹60,000
    """

    DEMO_REQUIREMENT = RequirementSchema(
        product="Coding Laptop (16GB RAM / 512GB SSD)",
        category="Computers",
        budget=60000.0,
        quantity="1 Unit",
        location="Hulkoti Market, Gadag",
        confidence=0.98,
        needs_clarification=False,
        human_interpretation="Customer requested a performance coding laptop under ₹60,000 in Hulkoti Market."
    )

    DEMO_SELLERS: List[Dict[str, Any]] = [
        {
            "id": "demo-seller-a",
            "name": "Seller A (Sri Lakshmi Electronics)",
            "distance_km": 1.2,
            "rating": 4.8,
            "initial_offer": 65000.0,
            "final_offer": 61500.0,
            "personality": "PREMIUM",
            "warranty": "2 Years On-Site",
            "availability": "In Stock"
        },
        {
            "id": "demo-seller-b",
            "name": "Seller B (Gadag Digital Hub)",
            "distance_km": 2.5,
            "rating": 4.6,
            "initial_offer": 63000.0,
            "final_offer": 59500.0,
            "personality": "FLEXIBLE",
            "warranty": "1 Year Standard",
            "availability": "In Stock"
        },
        {
            "id": "demo-seller-c",
            "name": "Seller C (Panchayat Tech Plaza)",
            "distance_km": 0.8,
            "rating": 4.9,
            "initial_offer": 62000.0,
            "final_offer": 58900.0, # WINNING DEAL
            "personality": "DISCOUNT",
            "warranty": "2 Years Full + Laptop Bag",
            "availability": "Ready for Immediate Pickup"
        },
        {
            "id": "demo-seller-d",
            "name": "Seller D (Hulkoti Laptop Zone)",
            "distance_km": 3.1,
            "rating": 4.4,
            "initial_offer": 66000.0,
            "final_offer": 60000.0,
            "personality": "FIRM",
            "warranty": "1 Year Extended",
            "availability": "Delivers in 2 Hours"
        }
    ]

    def __init__(self):
        self.reset_demo()

    def reset_demo(self):
        """Resets the demo simulation to initial state."""
        self.step_index = 0
        self.session_id = f"demo-session-{int(time.time())}"
        self.current_offers = {s["id"]: s["initial_offer"] for s in self.DEMO_SELLERS}
        self.completed = False
        
        sellers_schema_list = [
            SellerSchema(
                id=s["id"],
                name=s["name"],
                category="Computers",
                location="Hulkoti Market, Gadag",
                address="Main Road, Hulkoti",
                distanceKm=s["distance_km"],
                rating=s["rating"],
                verificationStatus="VERIFIED",
                responseRate=98,
                tenureYears=5,
                dealsCompleted=150,
                basePriceMultiplier=1.05,
                flexibility=10.0,
                warrantyOffered=s["warranty"],
                stockStatus="IN_STOCK",
                deliveryOffered=True,
                phone="+91 98450 00000"
            ) for s in self.DEMO_SELLERS
        ]

        # Initialize Fact Bus for Demo Session
        fact_bus.initialize_session(
            requirement=self.DEMO_REQUIREMENT,
            sellers=sellers_schema_list
        )
        return {"status": "DEMO_RESET_SUCCESS", "session_id": self.session_id}

    def advance_demo_step(self) -> Dict[str, Any]:
        """Advances the demo scenario by one negotiation round deterministically."""
        if self.completed:
            return {"status": "DEMO_COMPLETED", "winning_seller": "Seller C (Panchayat Tech Plaza)", "winning_price": 58900.0}

        self.step_index += 1

        if self.step_index == 1:
            # Round 1: Initial Quotes Recorded
            fact_bus.record_event("OFFER_RECEIVED", "Seller A submitted ₹65,000 initial offer", seller_id="demo-seller-a", seller_name="Seller A (Sri Lakshmi)", price=65000.0)
            fact_bus.record_event("OFFER_RECEIVED", "Seller B submitted ₹63,000 initial offer", seller_id="demo-seller-b", seller_name="Seller B (Gadag Digital)", price=63000.0)
            fact_bus.record_event("OFFER_RECEIVED", "Seller C submitted ₹62,000 initial offer", seller_id="demo-seller-c", seller_name="Seller C (Panchayat Tech Plaza)", price=62000.0)
            fact_bus.record_event("OFFER_RECEIVED", "Seller D submitted ₹66,000 initial offer", seller_id="demo-seller-d", seller_name="Seller D (Hulkoti Laptop Zone)", price=66000.0)
            fact_bus.record_event("BEST_OFFER_UPDATED", "Best discovered offer updated to ₹62,000 (Seller C)", seller_id="demo-seller-c", price=62000.0)
            fact_bus.best_offer = 62000.0
            fact_bus.best_seller_id = "demo-seller-c"
            fact_bus.best_seller_name = "Seller C (Panchayat Tech Plaza)"
            return {"round": 1, "message": "Initial merchant quotes received. Best: ₹62,000"}

        elif self.step_index == 2:
            # Round 2: Counter-Offers Sent & Seller B drops to ₹59,500
            fact_bus.record_event("COUNTER_OFFER_SENT", "AI Agent sent counter-offer of ₹59,000 to Seller B", seller_id="demo-seller-b")
            fact_bus.record_event("OFFER_RECEIVED", "Seller B counter-offered ₹59,500", seller_id="demo-seller-b", price=59500.0)
            fact_bus.record_event("BEST_OFFER_UPDATED", "Best discovered offer updated to ₹59,500 (Seller B)", seller_id="demo-seller-b", price=59500.0)
            fact_bus.best_offer = 59500.0
            fact_bus.best_seller_id = "demo-seller-b"
            fact_bus.best_seller_name = "Seller B (Gadag Digital Hub)"
            self.current_offers["demo-seller-b"] = 59500.0
            return {"round": 2, "message": "Seller B counter-offered ₹59,500! Below target budget."}

        elif self.step_index == 3:
            # Round 3: Benchmark Leveraged & Seller C drops to ₹58,900 (WINNING DEAL)
            fact_bus.record_event("BENCHMARK_LEVERAGED", "AI Agent informed Seller C of competing offer of ₹59,500", seller_id="demo-seller-c")
            fact_bus.record_event("OFFER_RECEIVED", "Seller C submitted final winning offer of ₹58,900!", seller_id="demo-seller-c", price=58900.0)
            fact_bus.record_event("BEST_OFFER_UPDATED", "Best discovered offer updated to ₹58,900 (Seller C)", seller_id="demo-seller-c", price=58900.0)
            fact_bus.best_offer = 58900.0
            fact_bus.best_seller_id = "demo-seller-c"
            fact_bus.best_seller_name = "Seller C (Panchayat Tech Plaza)"
            self.current_offers["demo-seller-c"] = 58900.0
            return {"round": 3, "message": "Seller C submitted best offer of ₹58,900!"}

        elif self.step_index >= 4:
            # Round 4: Final Concessions & Completion
            fact_bus.record_event("OFFER_RECEIVED", "Seller A final concession: ₹61,500", seller_id="demo-seller-a", price=61500.0)
            fact_bus.record_event("OFFER_RECEIVED", "Seller D final concession: ₹60,000", seller_id="demo-seller-d", price=60000.0)
            fact_bus.record_event("NEGOTIATION_COMPLETED", "Negotiation completed! Recommended seller: Seller C at ₹58,900", seller_id="demo-seller-c", price=58900.0)
            self.current_offers["demo-seller-a"] = 61500.0
            self.current_offers["demo-seller-d"] = 60000.0
            self.completed = True
            return {"round": 4, "message": "Negotiation session completed cleanly!", "completed": True}

demo_engine = DeterministicDemoEngine()
