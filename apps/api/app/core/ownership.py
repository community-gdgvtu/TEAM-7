"""
Panchayat AI — Resource Ownership Service
Layer 3 of the Defense-in-Depth authorization stack.

PURPOSE:
  After a route-level permission check passes, this service enforces that
  the requesting user actually OWNS the resource they are accessing.

  Example:
    - CUSTOMER has permission 'negotiation:read:own'
    - But they must also be the owner of the specific session_id
    - This service verifies that second requirement.

INVARIANT:
  - No function in this module ever returns data — it only raises or passes.
  - ADMIN and SUPER_ADMIN bypass ownership checks (they have :inspect perms).
  - All queries use indexed owner_id fields — never full collection scans.
"""

from fastapi import HTTPException, status
from typing import Optional
from app.core.database import db
from app.core.rbac import Permission, rbac_engine

# MongoDB collections
negotiation_sessions_col = db["negotiation_sessions"]
sellers_col              = db["sellers"]
fact_bus_events_col      = db["fact_bus_events"]
users_col                = db["users"]


# ─── Admin Bypass Check ───────────────────────────────────────────────────────

def _is_inspector(role: str) -> bool:
    """ADMINs and SUPER_ADMINs can inspect any resource without ownership."""
    return rbac_engine.check_permission(role, Permission.NEGOTIATION_INSPECT)


# ─── Negotiation Ownership ────────────────────────────────────────────────────

def assert_negotiation_owner(
    session_id: str,
    user_id: str,
    user_role: str
) -> None:
    """
    Raises HTTP 403 if user_id does not own the negotiation session.
    ADMINs and SUPER_ADMINs bypass ownership (they have negotiation:inspect).
    Raises HTTP 404 if session_id does not exist.
    """
    if _is_inspector(user_role):
        return  # Inspectors see all resources

    session = negotiation_sessions_col.find_one(
        {"_id": session_id},
        {"owner_id": 1}  # Projection: only fetch owner_id
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Negotiation session '{session_id}' not found"
        )

    if session.get("owner_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: you do not own this negotiation session"
        )


# ─── Seller / Business Ownership ─────────────────────────────────────────────

def assert_seller_owner(
    seller_id: str,
    user_id: str,
    user_role: str
) -> dict:
    """
    Raises HTTP 403 if user_id does not own the seller profile.
    Returns the seller document if ownership is confirmed.
    """
    if _is_inspector(user_role):
        # Admins can access any seller
        doc = sellers_col.find_one({"_id": seller_id}, {"password_hash": 0})
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Seller '{seller_id}' not found")
        return doc

    # For sellers: the user document contains seller_id
    user = users_col.find_one(
        {"_id": user_id, "seller_id": seller_id},
        {"seller_id": 1}
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: you do not own this seller profile"
        )

    doc = sellers_col.find_one({"_id": seller_id}, {"password_hash": 0})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Seller '{seller_id}' not found")
    return doc


# ─── Offer Ownership ──────────────────────────────────────────────────────────

def assert_offer_in_owned_session(
    session_id: str,
    seller_id: str,
    user_id: str,
    user_role: str
) -> None:
    """
    Verifies that a SELLER's counter-offer belongs to a session they are
    assigned to, OR that a CUSTOMER is reading their own offer.
    """
    if _is_inspector(user_role):
        return

    if rbac_engine.check_permission(user_role, Permission.OFFER_CREATE_OWN):
        # SELLER: must be assigned to this session
        session = negotiation_sessions_col.find_one(
            {"_id": session_id, "seller_ids": seller_id},
            {"_id": 1}
        )
        if not session:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: seller is not assigned to this negotiation session"
            )
    else:
        # CUSTOMER: must own the session
        assert_negotiation_owner(session_id, user_id, user_role)


# ─── Profile Ownership ────────────────────────────────────────────────────────

def assert_profile_owner(
    target_user_id: str,
    requesting_user_id: str,
    user_role: str
) -> None:
    """
    Raises HTTP 403 if user is trying to update someone else's profile.
    Only USER_MANAGE permission can update another user's profile.
    """
    if rbac_engine.check_permission(user_role, Permission.USER_MANAGE):
        return  # Admins can manage any profile

    if target_user_id != requesting_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: you can only update your own profile"
        )


# ─── Scoped Query Builder ─────────────────────────────────────────────────────

def build_ownership_filter(
    user_id: str,
    user_role: str,
    owner_field: str = "owner_id"
) -> dict:
    """
    Returns a MongoDB filter dict that scopes results to the user's owned records.
    For inspectors (ADMIN/SUPER_ADMIN), returns an empty filter (all records).

    Usage:
        ownership_filter = build_ownership_filter(user_id, user_role)
        results = collection.find({**base_filter, **ownership_filter})
    """
    if _is_inspector(user_role):
        return {}  # No restriction — see all
    return {owner_field: user_id}
