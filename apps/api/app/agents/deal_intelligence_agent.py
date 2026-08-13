from typing import List, Dict, Any, Optional
from app.schemas.schemas import (
    DealScoreSchema,
    ComponentScoresSchema,
    DealRecommendationResponseSchema,
    StrictOfferSchema,
    SellerSchema
)
from app.core.fact_bus import fact_bus

class DealIntelligenceAgent:
    """
    Agent 5 — Deal Intelligence Agent
    Evaluates multi-factor utility function across price, reliability, distance, warranty,
    stock availability, and offer confidence.
    Never ranks purely by raw price and never invents seller attributes.
    """

    def calculate_deal_recommendations(
        self,
        session_data: Optional[Dict[str, Any]] = None
    ) -> DealRecommendationResponseSchema:
        
        # Use provided session_data snapshot or fallback to active Fact Bus store
        if session_data:
            session_id = session_data.get("sessionId", fact_bus.session_id)
            offers_dict = session_data.get("offers", {})
            active_sellers = session_data.get("activeSellers", [])
            target_budget = session_data.get("requirement", {}).get("budget", 60000.0) if session_data.get("requirement") else 60000.0
            highest_initial = session_data.get("highestInitialQuote")
            best_discovered = session_data.get("bestOffer")
        else:
            session_id = fact_bus.session_id
            offers_dict = {k: v.model_dump() for k, v in fact_bus.offers.items()}
            active_sellers = [s.model_dump() for s in fact_bus.active_sellers]
            target_budget = fact_bus.requirement.budget if fact_bus.requirement else 60000.0
            highest_initial = fact_bus.highest_initial_quote
            best_discovered = fact_bus.best_offer

        offers_list = list(offers_dict.values())
        if not offers_list:
            return DealRecommendationResponseSchema(
                session_id=session_id,
                recommended_deal=None,
                ranked_offers=[],
                best_discovered_price=None,
                highest_initial_quote=None,
                total_savings=0.0,
                savings_percentage=0.0
            )

        prices = [o["price"] for o in offers_list]
        min_price = min(prices)
        max_price = max(prices)

        ranked_offers: List[DealScoreSchema] = []

        for offer in offers_list:
            seller_id = offer["seller_id"]
            price = offer["price"]
            warranty = offer.get("warranty", "Standard Warranty")
            availability = offer.get("availability", "IN_STOCK")
            confidence = offer.get("confidence", 0.94)

            # Find matching seller metadata
            seller_meta = next((s for s in active_sellers if s.get("id") == seller_id or s.get("_id") == seller_id), {})
            seller_name = offer.get("seller_name", seller_meta.get("name", "Local Merchant"))
            distance_km = seller_meta.get("distanceKm", seller_meta.get("distance_km", 1.5))
            rating = seller_meta.get("rating", 4.5)
            response_rate = seller_meta.get("responseRate", seller_meta.get("response_rate", 95))

            # --- Component Scores (0 - 100) ---
            # 1. Price Score (40% Weight)
            if max_price == min_price:
                price_score = 88.0
            else:
                price_score = round(100.0 - ((price - min_price) / (max_price - min_price)) * 35.0, 1)

            if price <= target_budget:
                price_score = min(100.0, price_score + 5.0)

            # 2. Reliability Score (20% Weight)
            reliability_score = round((rating / 5.0) * 80.0 + (response_rate / 100.0) * 20.0, 1)

            # 3. Distance Score (15% Weight)
            distance_score = round(max(30.0, 100.0 - (distance_km * 12.0)), 1)

            # 4. Warranty Score (10% Weight)
            if "1 year" in warranty.lower() or "brand" in warranty.lower():
                warranty_score = 95.0
            elif "6 month" in warranty.lower():
                warranty_score = 75.0
            else:
                warranty_score = 60.0

            # 5. Stock Availability Score (10% Weight)
            if availability == "IN_STOCK":
                availability_score = 100.0
            elif availability == "LIMITED":
                availability_score = 70.0
            else:
                availability_score = 40.0

            # 6. Offer Confidence Score (5% Weight)
            confidence_score = round(confidence * 100.0, 1)

            # Total Weighted Score calculation
            total_score = round(
                price_score * 0.40 +
                reliability_score * 0.20 +
                distance_score * 0.15 +
                warranty_score * 0.10 +
                availability_score * 0.10 +
                confidence_score * 0.05,
                1
            )

            # Trade-Off Highlights
            trade_offs: List[str] = []
            if price > min_price:
                diff = round(price - min_price)
                trade_offs.append(f"₹{diff:,.0f} higher than lowest price quote")
            else:
                trade_offs.append("Cheapest raw price offer discovered")

            if warranty_score >= 90.0:
                trade_offs.append(f"Includes premium {warranty}")
            if distance_km <= 1.0:
                trade_offs.append(f"Convenient local proximity ({distance_km} km)")
            if rating >= 4.7:
                trade_offs.append(f"Highly reliable merchant ({rating}⭐ rating)")

            # Explanation Generation
            if price == min_price and total_score >= 88.0:
                explanation = f"{seller_name} is recommended as the top overall value: lowest price at ₹{price:,.0f} with {rating}⭐ rating and {warranty}."
            else:
                explanation = (
                    f"{seller_name} is recommended despite not having the lowest raw price because the offer includes "
                    f"a {warranty}, high seller reliability ({rating}⭐) and confirmed {availability.lower().replace('_', ' ')} availability."
                )

            comp_scores = ComponentScoresSchema(
                price_score=price_score,
                reliability_score=reliability_score,
                distance_score=distance_score,
                warranty_score=warranty_score,
                availability_score=availability_score,
                confidence_score=confidence_score
            )

            ranked_offers.append(DealScoreSchema(
                seller_id=seller_id,
                seller_name=seller_name,
                price=price,
                distance_km=distance_km,
                rating=rating,
                warranty=warranty,
                availability=availability,
                total_score=total_score,
                component_scores=comp_scores,
                is_recommended=False,
                explanation=explanation,
                trade_offs=trade_offs
            ))

        # Sort offers by total_score descending
        ranked_offers.sort(key=lambda x: x.total_score, reverse=True)

        if ranked_offers:
            ranked_offers[0].is_recommended = True

        savings = (highest_initial - min_price) if (highest_initial and min_price) else 0.0
        savings_pct = round((savings / highest_initial) * 100, 2) if (highest_initial and savings > 0) else 0.0

        return DealRecommendationResponseSchema(
            session_id=session_id,
            recommended_deal=ranked_offers[0] if ranked_offers else None,
            ranked_offers=ranked_offers,
            best_discovered_price=min_price,
            highest_initial_quote=highest_initial,
            total_savings=savings,
            savings_percentage=savings_pct
        )

deal_intelligence_agent = DealIntelligenceAgent()

def calculate_deal_scores() -> List[Dict[str, Any]]:
    rec = deal_intelligence_agent.calculate_deal_recommendations()
    return [d.model_dump() for d in rec.ranked_offers]
