"""
Panchayat AI — Authorization Integration Tests
Resource-level authorization: ownership, cross-user isolation, and route-level 403s.

These tests verify the full Defense-in-Depth stack:
  Layer 2: Route permission guard (HTTP 403)
  Layer 3: Ownership service (raises HTTPException before DB access)
  Layer 4: Scoped queries (build_ownership_filter)

Run with:
    python -m pytest tests/test_authorization.py -v
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi import HTTPException
from unittest.mock import patch, MagicMock

from app.core.rbac import rbac_engine, Permission, UserRole
from app.core.ownership import (
    assert_negotiation_owner,
    assert_seller_owner,
    assert_profile_owner,
    assert_offer_in_owned_session,
    build_ownership_filter,
)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def make_user(role: str, user_id: str = "usr-test-001") -> dict:
    return {
        "_id": user_id,
        "id": user_id,
        "email": f"{role.lower()}@panchayat.ai",
        "role": role,
        "name": f"Test {role.title()}",
        "seller_id": "seller-001" if role == "SELLER" else None,
    }


# ─── Test: Ownership — Negotiation Sessions ───────────────────────────────────

class TestNegotiationOwnership:

    def test_owner_can_access_own_session(self):
        """Session owner must pass ownership check without error."""
        mock_session = {"_id": "sess-001", "owner_id": "usr-abc"}
        with patch("app.core.ownership.negotiation_sessions_col") as mock_col:
            mock_col.find_one.return_value = mock_session
            # Should NOT raise
            assert_negotiation_owner("sess-001", "usr-abc", "CUSTOMER")

    def test_non_owner_customer_is_forbidden(self):
        """A CUSTOMER accessing another customer's session must get 403."""
        mock_session = {"_id": "sess-001", "owner_id": "usr-abc"}
        with patch("app.core.ownership.negotiation_sessions_col") as mock_col:
            mock_col.find_one.return_value = mock_session
            with pytest.raises(HTTPException) as exc_info:
                assert_negotiation_owner("sess-001", "usr-different", "CUSTOMER")
            assert exc_info.value.status_code == 403
            assert "do not own" in exc_info.value.detail.lower()

    def test_missing_session_raises_404(self):
        """Accessing a non-existent session must return 404, not 403."""
        with patch("app.core.ownership.negotiation_sessions_col") as mock_col:
            mock_col.find_one.return_value = None
            with pytest.raises(HTTPException) as exc_info:
                assert_negotiation_owner("sess-nonexistent", "usr-abc", "CUSTOMER")
            assert exc_info.value.status_code == 404

    def test_admin_bypasses_ownership_check(self):
        """ADMIN must bypass ownership without a DB query."""
        with patch("app.core.ownership.negotiation_sessions_col") as mock_col:
            # Admin bypass: should NOT query DB
            assert_negotiation_owner("sess-any", "usr-admin", "ADMIN")
            mock_col.find_one.assert_not_called()

    def test_super_admin_bypasses_ownership_check(self):
        """SUPER_ADMIN must bypass ownership without a DB query."""
        with patch("app.core.ownership.negotiation_sessions_col") as mock_col:
            assert_negotiation_owner("sess-any", "usr-super", "SUPER_ADMIN")
            mock_col.find_one.assert_not_called()


# ─── Test: Ownership — Seller Profiles ────────────────────────────────────────

class TestSellerOwnership:

    def test_seller_can_access_own_profile(self):
        """Seller owner must pass ownership check."""
        mock_user = {"_id": "usr-seller-001", "seller_id": "seller-001"}
        mock_seller = {"_id": "seller-001", "name": "Test Shop", "owner_id": "usr-seller-001"}
        with patch("app.core.ownership.users_col") as mock_users, \
             patch("app.core.ownership.sellers_col") as mock_sellers:
            mock_users.find_one.return_value = mock_user
            mock_sellers.find_one.return_value = mock_seller
            result = assert_seller_owner("seller-001", "usr-seller-001", "SELLER")
            assert result["_id"] == "seller-001"

    def test_seller_cannot_access_other_sellers_profile(self):
        """A SELLER accessing another seller's profile must get 403."""
        with patch("app.core.ownership.users_col") as mock_users:
            # This seller does NOT have seller-999 linked
            mock_users.find_one.return_value = None
            with pytest.raises(HTTPException) as exc_info:
                assert_seller_owner("seller-999", "usr-seller-001", "SELLER")
            assert exc_info.value.status_code == 403

    def test_admin_bypasses_seller_ownership(self):
        """ADMIN must access any seller profile without ownership check."""
        mock_seller = {"_id": "seller-999", "name": "Any Shop"}
        with patch("app.core.ownership.sellers_col") as mock_sellers, \
             patch("app.core.ownership.users_col") as mock_users:
            mock_sellers.find_one.return_value = mock_seller
            result = assert_seller_owner("seller-999", "usr-admin", "ADMIN")
            # users_col should NOT be queried for admin
            mock_users.find_one.assert_not_called()
            assert result["_id"] == "seller-999"

    def test_missing_seller_raises_404(self):
        """Accessing a non-existent seller profile must return 404."""
        with patch("app.core.ownership.sellers_col") as mock_sellers:
            mock_sellers.find_one.return_value = None
            with pytest.raises(HTTPException) as exc_info:
                assert_seller_owner("seller-nonexistent", "usr-admin", "ADMIN")
            assert exc_info.value.status_code == 404


# ─── Test: Ownership — Profiles ───────────────────────────────────────────────

class TestProfileOwnership:

    def test_user_can_update_own_profile(self):
        """User updating their own profile must pass without error."""
        assert_profile_owner("usr-001", "usr-001", "CUSTOMER")  # No raise

    def test_user_cannot_update_another_profile(self):
        """CUSTOMER trying to update another user's profile must get 403."""
        with pytest.raises(HTTPException) as exc_info:
            assert_profile_owner("usr-target", "usr-attacker", "CUSTOMER")
        assert exc_info.value.status_code == 403
        assert "own profile" in exc_info.value.detail.lower()

    def test_seller_cannot_update_another_profile(self):
        """SELLER trying to update another user's profile must get 403."""
        with pytest.raises(HTTPException) as exc_info:
            assert_profile_owner("usr-target", "usr-seller-001", "SELLER")
        assert exc_info.value.status_code == 403

    def test_admin_can_update_any_profile(self):
        """ADMIN with user:manage must be able to update any profile."""
        # Should NOT raise (admin bypass)
        assert_profile_owner("usr-any", "usr-admin", "ADMIN")

    def test_super_admin_can_update_any_profile(self):
        """SUPER_ADMIN must be able to update any profile."""
        assert_profile_owner("usr-any", "usr-super", "SUPER_ADMIN")


# ─── Test: Offer Ownership ────────────────────────────────────────────────────

class TestOfferOwnership:

    def test_seller_assigned_to_session_can_create_offer(self):
        """SELLER assigned to a session can submit offers for it."""
        mock_session = {"_id": "sess-001"}
        with patch("app.core.ownership.negotiation_sessions_col") as mock_col:
            mock_col.find_one.return_value = mock_session
            # Should NOT raise
            assert_offer_in_owned_session("sess-001", "seller-001", "usr-seller", "SELLER")

    def test_seller_not_in_session_cannot_submit_offer(self):
        """SELLER not assigned to a session must get 403."""
        with patch("app.core.ownership.negotiation_sessions_col") as mock_col:
            mock_col.find_one.return_value = None  # Not assigned
            with pytest.raises(HTTPException) as exc_info:
                assert_offer_in_owned_session("sess-001", "seller-999", "usr-seller", "SELLER")
            assert exc_info.value.status_code == 403

    def test_admin_bypasses_offer_ownership(self):
        """ADMIN must bypass offer ownership check."""
        with patch("app.core.ownership.negotiation_sessions_col") as mock_col:
            assert_offer_in_owned_session("sess-any", "seller-any", "usr-admin", "ADMIN")
            mock_col.find_one.assert_not_called()


# ─── Test: Scoped Query Builder ───────────────────────────────────────────────

class TestScopedQueryBuilder:

    def test_customer_query_is_scoped_to_owner(self):
        """CUSTOMER query must include owner_id filter."""
        filter_ = build_ownership_filter("usr-001", "CUSTOMER")
        assert filter_ == {"owner_id": "usr-001"}

    def test_seller_query_is_scoped_to_owner(self):
        """SELLER query must include owner_id filter."""
        filter_ = build_ownership_filter("usr-seller-001", "SELLER")
        assert filter_ == {"owner_id": "usr-seller-001"}

    def test_admin_query_is_unrestricted(self):
        """ADMIN query must NOT include owner_id filter (sees all)."""
        filter_ = build_ownership_filter("usr-admin", "ADMIN")
        assert filter_ == {}

    def test_super_admin_query_is_unrestricted(self):
        """SUPER_ADMIN query must NOT include owner_id filter."""
        filter_ = build_ownership_filter("usr-super", "SUPER_ADMIN")
        assert filter_ == {}

    def test_custom_owner_field(self):
        """Custom owner field names must be respected."""
        filter_ = build_ownership_filter("usr-001", "CUSTOMER", owner_field="created_by")
        assert filter_ == {"created_by": "usr-001"}


# ─── Test: Route-Level Permission Enforcement ─────────────────────────────────

class TestRoutePermissionEnforcement:
    """
    Tests that the RBAC engine correctly supports the permission checks
    used at the route level via require_permission().
    """

    def test_negotiation_create_route_requires_customer_permission(self):
        """negotiation:create must be granted to CUSTOMER."""
        assert rbac_engine.check_permission("CUSTOMER", Permission.NEGOTIATION_CREATE)

    def test_negotiation_create_route_denied_to_seller(self):
        """SELLER must NOT have negotiation:create (they receive, not initiate)."""
        assert not rbac_engine.check_permission("SELLER", Permission.NEGOTIATION_CREATE)

    def test_offer_create_route_requires_seller_permission(self):
        """offer:create:own must be granted to SELLER."""
        assert rbac_engine.check_permission("SELLER", Permission.OFFER_CREATE_OWN)

    def test_offer_create_route_denied_to_customer(self):
        """CUSTOMER must NOT have offer:create:own."""
        assert not rbac_engine.check_permission("CUSTOMER", Permission.OFFER_CREATE_OWN)

    def test_analytics_route_requires_admin(self):
        """analytics:read must be granted to ADMIN and SUPER_ADMIN only."""
        assert rbac_engine.check_permission("ADMIN", Permission.ANALYTICS_READ)
        assert rbac_engine.check_permission("SUPER_ADMIN", Permission.ANALYTICS_READ)
        assert not rbac_engine.check_permission("CUSTOMER", Permission.ANALYTICS_READ)
        assert not rbac_engine.check_permission("SELLER", Permission.ANALYTICS_READ)

    def test_ai_configure_route_requires_super_admin_only(self):
        """ai:configure must be SUPER_ADMIN exclusive."""
        assert rbac_engine.check_permission("SUPER_ADMIN", Permission.AI_CONFIGURE)
        assert not rbac_engine.check_permission("ADMIN", Permission.AI_CONFIGURE)
        assert not rbac_engine.check_permission("SELLER", Permission.AI_CONFIGURE)
        assert not rbac_engine.check_permission("CUSTOMER", Permission.AI_CONFIGURE)

    def test_seller_verify_requires_admin_or_super_admin(self):
        """seller:verify must require at minimum ADMIN level."""
        assert rbac_engine.check_permission("ADMIN", Permission.SELLER_VERIFY)
        assert rbac_engine.check_permission("SUPER_ADMIN", Permission.SELLER_VERIFY)
        assert not rbac_engine.check_permission("SELLER", Permission.SELLER_VERIFY)
        assert not rbac_engine.check_permission("CUSTOMER", Permission.SELLER_VERIFY)


# ─── Test: Tool Calling Authorization ────────────────────────────────────────

class TestToolCallingAuthorization:
    """
    Tests that the AI tool calling engine enforces role-based authorization.
    The model must NEVER directly mutate the database.
    """

    def test_customer_can_execute_search_tool(self):
        """CUSTOMER role must be authorized to use search_nearby_sellers."""
        from app.core.ai_tool_calling_engine import AIToolCallingEngine, ToolExecutionRequestSchema
        engine_instance = AIToolCallingEngine()
        req = ToolExecutionRequestSchema(
            tool_name="search_nearby_sellers",
            arguments={"category": "Electronics"},
            user_role="CUSTOMER",
            session_id="test-sess-001"
        )
        result = engine_instance.execute_tool_call(req)
        # Should succeed (or at least not be an auth error)
        assert result.status != "AUTHORIZATION_ERROR"

    def test_unauthorized_role_blocked_on_create_negotiation(self):
        """
        Attempting to invoke create_negotiation with role='SELLER'
        must be blocked with AUTHORIZATION_ERROR.
        """
        from app.core.ai_tool_calling_engine import AIToolCallingEngine, ToolExecutionRequestSchema
        engine_instance = AIToolCallingEngine()
        req = ToolExecutionRequestSchema(
            tool_name="create_negotiation",
            arguments={"session_id": "s1", "customer_id": "c1", "seller_id": "s1", "target_price": 50000},
            user_role="SELLER",
            session_id="test-sess-002"
        )
        result = engine_instance.execute_tool_call(req)
        assert result.status == "AUTHORIZATION_ERROR"

    def test_unknown_tool_returns_validation_error(self):
        """Attempting to call an unregistered tool must return VALIDATION_ERROR, not execute."""
        from app.core.ai_tool_calling_engine import AIToolCallingEngine, ToolExecutionRequestSchema
        engine_instance = AIToolCallingEngine()
        req = ToolExecutionRequestSchema(
            tool_name="drop_all_tables",  # Malicious/nonexistent tool
            arguments={},
            user_role="ADMIN",
            session_id="test-sess-003"
        )
        result = engine_instance.execute_tool_call(req)
        assert result.status == "VALIDATION_ERROR"
        assert "not a registered" in result.result.get("error", "")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
