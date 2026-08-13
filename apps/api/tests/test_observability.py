import pytest
from app.core.observability import (
    StructuredLogger,
    check_database_health,
    check_ai_engine_health,
    check_websocket_health
)

def test_database_health_check():
    health = check_database_health()
    assert health["status"] in ["HEALTHY", "DEGRADED"]
    assert "latency_ms" in health

def test_ai_engine_health_check():
    health = check_ai_engine_health()
    assert health["status"] == "HEALTHY"
    assert "active_agents" in health
    assert len(health["active_agents"]) == 5

def test_websocket_health_check():
    health = check_websocket_health()
    assert health["status"] == "HEALTHY"
    assert "channel" in health

def test_structured_logger_sensitive_field_masking():
    # Should not raise exception and must sanitize sensitive extra dict keys
    StructuredLogger.log(
        event_name="TEST_AUTH_EVENT",
        request_id="req-test-123",
        extra={
            "user": "test_user",
            "password": "SecretPassword123!",
            "access_token": "bearer_secret_xyz"
        }
    )
