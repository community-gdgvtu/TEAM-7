import math
from typing import List, Dict, Any, Optional
from app.schemas.schemas import RequirementSchema, SellerSchema, DiscoveredSellerSchema, DiscoverySearchResponseSchema
from app.core.database import sellers_col

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes Haversine distance in kilometers between two lat/lng coordinates.
    Prepared for Google Maps / Mapbox geospatial integration.
    """
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

class SellerDiscoveryEngine:
    """
    Agent 2 — Seller Discovery Engine
    Ranks relevant local sellers using a deterministic 8-signal scoring model:
    - Product & Category Relevance (30%)
    - Distance Proximity (25%)
    - Reliability & Historical Rating (20%)
    - Price Competitiveness (15%)
    - Explicit Inventory Availability (10%)
    """

    def discover_and_rank(
        self,
        requirement: RequirementSchema,
        category_filter: Optional[str] = None,
        max_distance_km: float = 10.0,
        min_rating: float = 0.0,
        sort_by: str = "match_score",
        skip: int = 0,
        limit: int = 10
    ) -> DiscoverySearchResponseSchema:
        
        target_category = category_filter or requirement.category
        
        # Query MongoDB Atlas sellers collection
        query: Dict[str, Any] = {}
        if target_category and target_category != "All":
            query["category"] = target_category
        if min_rating > 0.0:
            query["rating"] = {"$gte": min_rating}

        cursor = sellers_col.find(query)
        db_sellers = list(cursor)

        # Fallback to local default sellers if DB is empty
        if not db_sellers:
            db_sellers = [
                {
                    "_id": "seller-1",
                    "name": "Sri Lakshmi Electronics & Computers",
                    "category": requirement.category,
                    "location": "Hulkoti Market, Gadag",
                    "address": "Main Road Near Bus Stand, Hulkoti",
                    "distance_km": 0.8,
                    "rating": 4.8,
                    "verification_status": "VERIFIED",
                    "response_rate": 98,
                    "tenure_years": 7,
                    "deals_completed": 412,
                    "base_price_multiplier": 1.08,
                    "flexibility": 12.0,
                    "warranty_offered": "1 Year Brand + 6 Mo Shop Warranty",
                    "stock_status": "IN_STOCK",
                    "delivery_offered": True,
                    "phone": "+91 98452 11092"
                }
            ]

        discovered_list: List[DiscoveredSellerSchema] = []

        # Customer lat/lng (Hulkoti Market coordinates: 15.4328, 75.6318)
        cust_lat = 15.4328
        cust_lng = 75.6318

        for s in db_sellers:
            s_id = s.get("_id", s.get("id"))
            distance = s.get("distance_km", s.get("distanceKm", 1.0))
            
            # Recalculate distance using Haversine if lat/lng available
            if "latitude" in s and "longitude" in s:
                distance = calculate_haversine_distance(cust_lat, cust_lng, s["latitude"], s["longitude"])

            if distance > max_distance_km:
                continue

            seller_schema = SellerSchema(
                id=str(s_id),
                name=s["name"],
                category=s["category"],
                location=s["location"],
                address=s["address"],
                distanceKm=distance,
                rating=s["rating"],
                verificationStatus=s.get("verification_status", s.get("verificationStatus", "VERIFIED")),
                responseRate=s.get("response_rate", s.get("responseRate", 95)),
                tenureYears=s.get("tenure_years", s.get("tenureYears", 5)),
                dealsCompleted=s.get("deals_completed", s.get("dealsCompleted", 200)),
                basePriceMultiplier=s.get("base_price_multiplier", s.get("basePriceMultiplier", 1.08)),
                flexibility=s["flexibility"],
                warrantyOffered=s.get("warranty_offered", s.get("warrantyOffered", "1 Year Brand Warranty")),
                stockStatus=s.get("stock_status", s.get("stockStatus", "IN_STOCK")),
                deliveryOffered=s.get("delivery_offered", s.get("deliveryOffered", True)),
                phone=s["phone"]
            )

            # Scoring Algorithm Breakdown (0 - 100)
            # Signal 1: Category & Product Specialization (30 pts)
            cat_score = 30.0 if s["category"] == requirement.category else 15.0

            # Signal 2: Proximity Distance Score (25 pts)
            distance_score = max(0.0, 25.0 - (distance * 2.5))

            # Signal 3: Reliability & Response Rate (20 pts)
            rel_score = (seller_schema.rating / 5.0) * 15.0 + (seller_schema.responseRate / 100.0) * 5.0

            # Signal 4: Price Competitiveness & Flexibility (15 pts)
            flex_score = min(15.0, (seller_schema.flexibility / 15.0) * 15.0)

            # Signal 5: Stock Availability (10 pts)
            stock_score = 10.0 if seller_schema.stockStatus == "IN_STOCK" else (5.0 if seller_schema.stockStatus == "LIMITED" else 2.0)

            total_match_score = round(cat_score + distance_score + rel_score + flex_score + stock_score, 1)
            reliability_score = round((seller_schema.rating / 5.0) * 80.0 + (seller_schema.responseRate / 100.0) * 20.0, 1)

            # Estimated Price Range calculation
            est_min = round(requirement.budget * (seller_schema.basePriceMultiplier * (1.0 - (seller_schema.flexibility / 100.0))))
            est_max = round(requirement.budget * seller_schema.basePriceMultiplier)
            price_range_str = f"₹{est_min:,.0f} - ₹{est_max:,.0f}"

            explanation = (
                f"Ranked {total_match_score}/100 match: Located {distance} km away in {seller_schema.location}, "
                f"{seller_schema.rating}⭐ rating with {seller_schema.responseRate}% response rate and verified {seller_schema.stockStatus.lower().replace('_', ' ')} inventory."
            )

            discovered_list.append(DiscoveredSellerSchema(
                seller=seller_schema,
                match_score=total_match_score,
                distance_km=distance,
                available_product=requirement.product,
                estimated_price_range=price_range_str,
                reliability_score=reliability_score,
                explanation=explanation
            ))

        # Sorting logic
        if sort_by == "distance":
            discovered_list.sort(key=lambda x: x.distance_km)
        elif sort_by == "rating":
            discovered_list.sort(key=lambda x: x.seller.rating, reverse=True)
        elif sort_by == "price":
            discovered_list.sort(key=lambda x: x.seller.basePriceMultiplier)
        else: # default: match_score
            discovered_list.sort(key=lambda x: x.match_score, reverse=True)

        total_found = len(discovered_list)
        paginated_results = discovered_list[skip : skip + limit]

        return DiscoverySearchResponseSchema(
            total_found=total_found,
            sellers=paginated_results,
            category_filter=target_category,
            location_filter=requirement.location,
            page=(skip // limit) + 1 if limit > 0 else 1,
            limit=limit
        )

discovery_engine = SellerDiscoveryEngine()

def discover_sellers(requirement: RequirementSchema) -> List[SellerSchema]:
    res = discovery_engine.discover_and_rank(requirement)
    return [d.seller for d in res.sellers]
