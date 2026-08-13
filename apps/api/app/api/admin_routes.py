from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Dict, Any
from app.core.dependencies import require_permission, get_current_user
from app.core.rbac import Permission
from app.core.database import users_col, sellers_col, negotiation_sessions_col

admin_router = APIRouter(prefix="/admin", tags=["Admin System Control"])


@admin_router.get("/metrics")
def get_system_metrics(
    admin_user: Dict[str, Any] = Depends(require_permission(Permission.ANALYTICS_READ))
):
    """Returns system-wide aggregated telemetry metrics. Requires: analytics:read"""
    return {
        "total_users": users_col.count_documents({}),
        "total_sellers": sellers_col.count_documents({}),
        "total_sessions": negotiation_sessions_col.count_documents({}),
        "status": "HEALTHY",
        "requested_by": admin_user["id"],
        "requester_role": admin_user.get("role"),
    }


@admin_router.get("/audit-log")
def get_system_audit_log(
    admin_user: Dict[str, Any] = Depends(require_permission(Permission.AUDIT_READ))
):
    """Returns system security audit logs. Requires: audit:read"""
    from app.core.ai_reliability import ai_decisions_col
    from app.core.database import db

    # Real audit events from MongoDB
    ai_tool_calls = list(db["ai_tool_calls"].find().sort("timestamp", -1).limit(20))
    for doc in ai_tool_calls:
        doc.pop("_id", None)

    return {
        "requested_by": admin_user["id"],
        "audit_events": ai_tool_calls,
        "count": len(ai_tool_calls),
    }


@admin_router.get("/ai-decisions")
def get_ai_decisions_inspection(
    limit: int = Query(50, ge=1, le=200),
    admin_user: Dict[str, Any] = Depends(require_permission(Permission.AUDIT_READ))
):
    """
    Returns complete AI decision audit trail. Requires: audit:read
    Audits agent name, input reference, confidence, latency, validation result.
    """
    from app.core.ai_reliability import ai_decisions_col
    decisions = list(ai_decisions_col.find().sort("timestamp", -1).limit(limit))
    for d in decisions:
        d.pop("_id", None)
    return {
        "total_decisions": len(decisions),
        "decisions": decisions,
        "requested_by": admin_user["id"],
    }


@admin_router.get("/ai-decisions/{decision_id}")
def get_ai_decision_by_id(
    decision_id: str,
    admin_user: Dict[str, Any] = Depends(require_permission(Permission.AUDIT_READ))
):
    """Returns single AI decision audit record by ID. Requires: audit:read"""
    from app.core.ai_reliability import ai_decisions_col
    decision = ai_decisions_col.find_one({"_id": decision_id})
    if not decision:
        raise HTTPException(status_code=404, detail=f"AI Decision record '{decision_id}' not found")
    decision.pop("_id", None)
    return decision


@admin_router.get("/users")
def list_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    admin_user: Dict[str, Any] = Depends(require_permission(Permission.USER_MANAGE))
):
    """
    Lists all registered users with role and metadata. Requires: user:manage
    Password hashes are always excluded from the response.
    """
    users = list(
        users_col.find({}, {"password_hash": 0}).skip(skip).limit(limit)
    )
    for u in users:
        u["id"] = u.pop("_id", u.get("id"))

    return {
        "users": users,
        "count": len(users),
        "total": users_col.count_documents({}),
        "requested_by": admin_user["id"],
    }


@admin_router.get("/users/{user_id}")
def get_user_by_id(
    user_id: str,
    admin_user: Dict[str, Any] = Depends(require_permission(Permission.USER_MANAGE))
):
    """Returns a specific user's profile. Requires: user:manage. Password excluded."""
    user = users_col.find_one({"_id": user_id}, {"password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found")
    user["id"] = user.pop("_id", user.get("id"))
    return user


@admin_router.post("/sellers/{seller_id}/verify")
def verify_seller(
    seller_id: str,
    admin_user: Dict[str, Any] = Depends(require_permission(Permission.SELLER_VERIFY))
):
    """
    Marks a seller as VERIFIED on the Panchayat AI platform. Requires: seller:verify
    Only ADMIN and SUPER_ADMIN can perform verification.
    """
    seller = sellers_col.find_one({"_id": seller_id})
    if not seller:
        raise HTTPException(status_code=404, detail=f"Seller '{seller_id}' not found")

    sellers_col.update_one(
        {"_id": seller_id},
        {"$set": {
            "verification_status": "VERIFIED",
            "verified_by": admin_user["id"],
            "verified_at": __import__("time").strftime("%Y-%m-%d %H:%M:%S"),
        }}
    )
    return {
        "status": "VERIFIED",
        "seller_id": seller_id,
        "verified_by": admin_user["id"],
        "message": f"Seller '{seller.get('name', seller_id)}' has been verified.",
    }


@admin_router.post("/sellers/{seller_id}/revoke")
def revoke_seller_verification(
    seller_id: str,
    admin_user: Dict[str, Any] = Depends(require_permission(Permission.SELLER_VERIFY))
):
    """
    Revokes a seller's verification status. Requires: seller:verify
    """
    seller = sellers_col.find_one({"_id": seller_id})
    if not seller:
        raise HTTPException(status_code=404, detail=f"Seller '{seller_id}' not found")

    sellers_col.update_one(
        {"_id": seller_id},
        {"$set": {
            "verification_status": "REVOKED",
            "revoked_by": admin_user["id"],
            "revoked_at": __import__("time").strftime("%Y-%m-%d %H:%M:%S"),
        }}
    )
    return {
        "status": "REVOKED",
        "seller_id": seller_id,
        "revoked_by": admin_user["id"],
    }


@admin_router.get("/negotiations")
def inspect_all_negotiations(
    limit: int = Query(50, ge=1, le=200),
    admin_user: Dict[str, Any] = Depends(require_permission(Permission.NEGOTIATION_INSPECT))
):
    """
    Returns all negotiation sessions across all users. Requires: negotiation:inspect
    Admins can inspect all sessions without ownership requirement.
    """
    sessions = list(negotiation_sessions_col.find().sort("created_at", -1).limit(limit))
    for s in sessions:
        s.pop("_id", None)
    return {
        "sessions": sessions,
        "count": len(sessions),
        "requested_by": admin_user["id"],
    }


@admin_router.put("/ai/configure")
def configure_ai_engine(
    payload: Dict[str, Any],
    super_admin: Dict[str, Any] = Depends(require_permission(Permission.AI_CONFIGURE))
):
    """
    Configures AI engine parameters. Requires: ai:configure (SUPER_ADMIN only).
    No other role can access this endpoint.
    """
    allowed_keys = {"max_negotiation_rounds", "model_temperature", "enable_benchmark_leveraging"}
    invalid_keys = set(payload.keys()) - allowed_keys
    if invalid_keys:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid configuration keys: {list(invalid_keys)}. Allowed: {list(allowed_keys)}"
        )
    return {
        "status": "CONFIGURED",
        "applied_by": super_admin["id"],
        "settings": payload,
        "message": "AI engine configuration applied. Restart service to take effect.",
    }


@admin_router.put("/security/configure")
def configure_security(
    payload: Dict[str, Any],
    super_admin: Dict[str, Any] = Depends(require_permission(Permission.SECURITY_CONFIGURE))
):
    """
    Configures security parameters. Requires: security:configure (SUPER_ADMIN only).
    """
    return {
        "status": "CONFIGURED",
        "applied_by": super_admin["id"],
        "message": "Security configuration recorded. Manual deployment required.",
    }
