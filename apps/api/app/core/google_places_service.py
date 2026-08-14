import os
import requests
import math
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

# Google Places API (New) & Routes API Base URLs
PLACES_API_NEW_URL = "https://places.googleapis.com/v1/places:searchText"
ROUTES_API_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", os.getenv("GEMINI_API_KEY", ""))

class RealSellerSchema(BaseModel):
    place_id: str
    name: str
    address: str
    location: Dict[str, float] # {"lat": 15.4328, "lng": 75.6318}
    distance_km: float
    eta_minutes: Optional[int] = None
    types: List[str] = []
    business_status: str = "OPERATIONAL"
    website: Optional[str] = None
    phone: Optional[str] = None
    rating: Optional[float] = None
    user_ratings_total: Optional[int] = None
    connection_status: str = "DISCOVERED" # DISCOVERED, UNVERIFIED, CONNECTION_REQUESTED, CONNECTED, NEGOTIATION_ENABLED, SUSPENDED

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates geodesic distance in kilometers between two coordinates."""
    R = 6371.0 # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

class GooglePlacesDiscoveryService:
    """
    Real Seller Discovery & Navigation Service using Google Maps Platform APIs:
    - Places API (New): Live place search, place details, place IDs, categories, phone numbers.
    - Routes API: Distance, travel time, ETAs, traffic-aware driving routes.
    """

    def compute_route_eta(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float
    ) -> Dict[str, Any]:
        """Uses Google Routes API to compute distance, travel time, and traffic-aware ETA."""
        api_key = GOOGLE_MAPS_API_KEY or os.getenv("GOOGLE_MAPS_API_KEY")
        if not api_key:
            dist_km = calculate_haversine_distance(origin_lat, origin_lng, dest_lat, dest_lng)
            eta_mins = max(1, int((dist_km / 25.0) * 60))
            return {
                "distance_km": dist_km,
                "eta_minutes": eta_mins,
                "travel_mode": "DRIVE",
                "routing_status": "ESTIMATED_HAVERSINE"
            }

        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline"
        }

        payload = {
            "origin": {"location": {"latLng": {"latitude": origin_lat, "longitude": origin_lng}}},
            "destination": {"location": {"latLng": {"latitude": dest_lat, "longitude": dest_lng}}},
            "travelMode": "DRIVE",
            "routingPreference": "TRAFFIC_AWARE"
        }

        try:
            resp = requests.post(ROUTES_API_URL, json=payload, headers=headers, timeout=4.0)
            if resp.status_code == 200:
                data = resp.json()
                routes = data.get("routes", [])
                if routes:
                    first_route = routes[0]
                    dist_meters = first_route.get("distanceMeters", 0)
                    duration_str = first_route.get("duration", "0s").replace("s", "")
                    duration_secs = int(duration_str) if duration_str.isdigit() else 0
                    
                    return {
                        "distance_km": round(dist_meters / 1000.0, 2),
                        "eta_minutes": max(1, math.ceil(duration_secs / 60.0)),
                        "travel_mode": "DRIVE_TRAFFIC_AWARE",
                        "routing_status": "SUCCESS"
                    }
        except Exception:
            pass

        # Fallback estimation
        dist_km = calculate_haversine_distance(origin_lat, origin_lng, dest_lat, dest_lng)
        return {
            "distance_km": dist_km,
            "eta_minutes": max(1, int((dist_km / 25.0) * 60)),
            "travel_mode": "DRIVE",
            "routing_status": "ESTIMATED_HAVERSINE"
        }

    def fetch_nearby_real_sellers(
        self,
        lat: float,
        lng: float,
        radius_meters: float = 5000.0,
        category: str = "Electronics",
        query_text: Optional[str] = None
    ) -> Dict[str, Any]:
        
        api_key = GOOGLE_MAPS_API_KEY or os.getenv("GOOGLE_MAPS_API_KEY")

        if not api_key:
            return {
                "status": "PLACES_API_KEY_REQUIRED",
                "error": "Google Maps Platform API key is required for live place search.",
                "attribution": "Powered by Google",
                "sellers": []
            }

        text_query = query_text or f"{category} store near me"

        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.businessStatus,places.websiteUri,places.nationalPhoneNumber,places.rating,places.userRatingCount"
        }

        payload = {
            "textQuery": text_query,
            "locationBias": {
                "circle": {
                    "center": {
                        "latitude": lat,
                        "longitude": lng
                    },
                    "radius": radius_meters
                }
            },
            "maxResultCount": 15
        }

        try:
            resp = requests.post(PLACES_API_NEW_URL, json=payload, headers=headers, timeout=5.0)
            
            if resp.status_code != 200:
                return {
                    "status": "API_ERROR",
                    "error": f"Google Places API returned status {resp.status_code}: {resp.text}",
                    "attribution": "Powered by Google",
                    "sellers": []
                }

            data = resp.json()
            raw_places = data.get("places", [])
            sellers: List[RealSellerSchema] = []

            for place in raw_places:
                place_id = place.get("id", "")
                name = place.get("displayName", {}).get("text", "Unknown Business")
                address = place.get("formattedAddress", "Address not available")
                loc = place.get("location", {})
                p_lat = loc.get("latitude", lat)
                p_lng = loc.get("longitude", lng)
                
                dist_km = calculate_haversine_distance(lat, lng, p_lat, p_lng)
                eta_mins = max(1, int((dist_km / 25.0) * 60))

                seller = RealSellerSchema(
                    place_id=place_id,
                    name=name,
                    address=address,
                    location={"lat": p_lat, "lng": p_lng},
                    distance_km=dist_km,
                    eta_minutes=eta_mins,
                    types=place.get("types", []),
                    business_status=place.get("businessStatus", "OPERATIONAL"),
                    website=place.get("websiteUri"),
                    phone=place.get("nationalPhoneNumber"),
                    rating=place.get("rating"),
                    user_ratings_total=place.get("userRatingCount"),
                    connection_status="DISCOVERED"
                )
                sellers.append(seller)

            # Sort by distance
            sellers.sort(key=lambda s: s.distance_km)

            return {
                "status": "SUCCESS",
                "total_found": len(sellers),
                "user_location": {"lat": lat, "lng": lng},
                "attribution": "Powered by Google",
                "sellers": [s.model_dump() for s in sellers]
            }

        except Exception as e:
            return {
                "status": "API_UNAVAILABLE",
                "error": f"Failed to connect to Google Places API: {str(e)}",
                "attribution": "Powered by Google",
                "sellers": []
            }

places_discovery_service = GooglePlacesDiscoveryService()
