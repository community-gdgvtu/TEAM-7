import pytest
from app.core.google_places_service import places_discovery_service, calculate_haversine_distance

def test_haversine_distance_calculation():
    # Distance between Hulkoti Market (15.4328, 75.6318) and Gadag Station (15.4265, 75.6341)
    dist = calculate_haversine_distance(15.4328, 75.6318, 15.4265, 75.6341)
    assert dist > 0.5
    assert dist < 3.0

def test_real_places_search_honest_error_when_key_unconfigured(monkeypatch):
    """Verifies that missing API keys return an honest error state rather than fake sellers."""
    monkeypatch.setenv("GOOGLE_MAPS_API_KEY", "")
    res = places_discovery_service.fetch_nearby_real_sellers(
        lat=15.4328,
        lng=75.6318,
        radius_meters=5000.0,
        category="Electronics"
    )

    assert res["status"] == "PLACES_API_KEY_REQUIRED"
    assert res["attribution"] == "Powered by Google"
    assert res["sellers"] == [] # Never falls back to fake data!

def test_seller_lifecycle_status_invariant():
    """Invariance Check: Discovered Google Places MUST start as DISCOVERED/UNVERIFIED."""
    from app.core.google_places_service import RealSellerSchema
    seller = RealSellerSchema(
        place_id="ChIJN1t_tDe5vzsR0eLspJJ3qg4",
        name="Real Google Electronics Shop",
        address="Station Road, Gadag",
        location={"lat": 15.4328, "lng": 75.6318},
        distance_km=0.8
    )

    assert seller.connection_status == "DISCOVERED"
    assert seller.connection_status != "NEGOTIATION_ENABLED" # Needs explicit onboarding
