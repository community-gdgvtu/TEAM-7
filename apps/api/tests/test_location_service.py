import pytest
from pydantic import ValidationError
from app.core.location_service import location_service, LocationSessionPayloadSchema

def test_reverse_geocode_valid_coordinates():
    rev = location_service.reverse_geocode(15.4328, 75.6318)
    assert rev.latitude == 15.4328
    assert rev.longitude == 75.6318
    assert rev.formatted_address

def test_reverse_geocode_invalid_coordinates():
    with pytest.raises(ValueError, match="Invalid GPS coordinates"):
        location_service.reverse_geocode(95.0, 75.6318)
    with pytest.raises(ValueError, match="Invalid GPS coordinates"):
        location_service.reverse_geocode(15.4328, 200.0)

def test_create_location_session_gps_browser():
    payload = LocationSessionPayloadSchema(
        latitude=15.4328,
        longitude=75.6318,
        accuracy_meters=12.5,
        timestamp="2026-08-14T00:00:00Z",
        source="GPS_BROWSER",
        persist_precise=False
    )

    sess = location_service.create_location_session(payload)
    assert sess["status"] == "READY"
    assert "loc-sess-" in sess["location_session_id"]
    assert sess["source"] == "GPS_BROWSER"
    assert sess["coordinates"]["latitude"] == 15.4328
    assert sess["coordinates"]["longitude"] == 75.6318
    assert sess["coordinates"]["accuracy_meters"] == 12.5
    # Verify privacy preservation when persist_precise is False
    assert sess["persisted_record"]["is_precise"] is False
    assert sess["persisted_record"]["latitude"] == 15.43
    assert sess["persisted_record"]["longitude"] == 75.63

def test_create_location_session_manual_input():
    payload = LocationSessionPayloadSchema(
        latitude=12.9716,
        longitude=77.5946,
        accuracy_meters=0.0,
        timestamp="2026-08-14T00:00:00Z",
        source="MANUAL_USER_INPUT",
        persist_precise=True
    )

    sess = location_service.create_location_session(payload)
    assert sess["status"] == "READY"
    assert sess["source"] == "MANUAL_USER_INPUT"
    assert sess["persisted_record"]["is_precise"] is True
    assert sess["persisted_record"]["latitude"] == 12.9716

def test_create_location_session_validation_error():
    # Latitude out of bounds
    with pytest.raises(ValidationError):
        LocationSessionPayloadSchema(
            latitude=120.0,
            longitude=75.6318,
            accuracy_meters=5.0,
            timestamp="2026-08-14T00:00:00Z"
        )

    # Negative accuracy
    with pytest.raises(ValidationError):
        LocationSessionPayloadSchema(
            latitude=15.4328,
            longitude=75.6318,
            accuracy_meters=-5.0,
            timestamp="2026-08-14T00:00:00Z"
        )

    # Empty timestamp
    with pytest.raises(ValidationError):
        LocationSessionPayloadSchema(
            latitude=15.4328,
            longitude=75.6318,
            accuracy_meters=10.0,
            timestamp=""
        )

    # Invalid source
    with pytest.raises(ValidationError):
        LocationSessionPayloadSchema(
            latitude=15.4328,
            longitude=75.6318,
            accuracy_meters=10.0,
            timestamp="2026-08-14T00:00:00Z",
            source="INVALID_GPS_TYPE"  # type: ignore
        )
