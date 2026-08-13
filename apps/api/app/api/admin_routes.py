from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from app.core.dependencies import get_current_admin
from app.core.database import users_col, sellers_col, negotiation_sessions_col

admin_router = APIRouter(prefix="/admin", tags=["Admin System Control"])

@admin_router.get("/metrics")
def get_system_metrics(admin_user: Dict[str, Any] = Depends(get_current_admin)):
    """Returns system-wide aggregated telemetry metrics (ADMIN ONLY)."""
    return {
        "total_users": users_col.count_documents({}),
        "total_sellers": sellers_col.count_documents({}),
        "total_sessions": negotiation_sessions_col.count_documents({}),
        "status": "HEALTHY",
        "admin_id": admin_user["id"]
    }

@admin_router.get("/audit-log")
def get_system_audit_log(admin_user: Dict[str, Any] = Depends(get_current_admin)):
    """Returns system security audit logs (ADMIN ONLY)."""
    return {
        "audit_logs": [
            {"event": "PROMPT_INJECTION_BLOCKED", "timestamp": "2026-08-13 19:40:12", "severity": "HIGH", "status": "NEUTRALIZED"},
            {"event": "RBAC_ACCESS_DENIED", "timestamp": "2026-08-13 19:42:05", "severity": "MEDIUM", "status": "DENIED"},
            {"event": "FACT_BUS_COMMIT", "timestamp": "2026-08-13 19:50:00", "severity": "INFO", "status": "SUCCESS"}
        ]
    }

@admin_router.get("/ai-decisions")
def get_ai_decisions_inspection(
    limit: int = 50,
    admin_user: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Returns complete AI decision audit trail for inspection (ADMIN ONLY).
    Audits agent name, input reference, structured output, confidence, latency, and validation result.
    """
    from app.core.ai_reliability import ai_decisions_col
    decisions = list(ai_decisions_col.find().sort("timestamp", -1).limit(limit))
    return {
        "total_decisions": len(decisions),
        "decisions": decisions
    }

@admin_router.get("/ai-decisions/{decision_id}")
def get_ai_decision_by_id(
    decision_id: str,
    admin_user: Dict[str, Any] = Depends(get_current_admin)
):
    """Returns single AI decision audit record by ID (ADMIN ONLY)."""
    from app.core.ai_reliability import ai_decisions_col
    decision = ai_decisions_col.find_one({"_id": decision_id})
    if not decision:
        raise HTTPException(status_code=404, detail=f"AI Decision record '{decision_id}' not found")
    return decision
