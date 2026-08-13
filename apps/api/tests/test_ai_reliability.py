import pytest
from pydantic import BaseModel
from app.core.ai_reliability import ai_reliability_engine, AIReliabilityEngine, ai_decisions_col

class DummyOutputSchema(BaseModel):
    product: str
    price: float
    confidence: float = 0.95

def test_ai_decision_audit_trail_logging():
    """Test recording an AI decision audit trail entry."""
    doc = ai_reliability_engine.record_decision(
        agent="RequirementAgent",
        input_reference="Laptop under 60k",
        output={"product": "Laptop", "price": 60000.0},
        confidence=0.96,
        model="panchayat-ai-v1",
        latency_ms=42.5,
        validation_result="PASSED"
    )

    assert doc.agent == "RequirementAgent"
    assert doc.confidence == 0.96
    assert doc.validation_result == "PASSED"

def test_execute_with_reliability_success():
    """Test successful schema validation and audit trail persistence."""
    def sample_func():
        return {"product": "Basmati Rice 5kg", "price": 550.0, "confidence": 0.98}

    def fallback():
        return DummyOutputSchema(product="Default", price=100.0, confidence=0.50)

    result = ai_reliability_engine.execute_with_reliability(
        agent_name="OfferExtractionAgent",
        input_ref="Basmati rice 5kg for 550",
        func=sample_func,
        schema_cls=DummyOutputSchema,
        fallback_factory=fallback
    )

    assert result.product == "Basmati Rice 5kg"
    assert result.price == 550.0
    assert result.confidence == 0.98

def test_execute_with_reliability_fallback_on_failure():
    """Test fallback strategy when function fails validation after retries."""
    def failing_func():
        raise ValueError("Simulated LLM schema failure")

    def fallback():
        return DummyOutputSchema(product="Fallback Laptop", price=50000.0, confidence=0.50)

    result = ai_reliability_engine.execute_with_reliability(
        agent_name="NegotiationAgent",
        input_ref="Invalid prompt",
        func=failing_func,
        schema_cls=DummyOutputSchema,
        fallback_factory=fallback,
        max_retries=2
    )

    assert result.product == "Fallback Laptop"
    assert result.price == 50000.0
    assert result.confidence == 0.50
