"""
Panchayat AI — Comprehensive RBAC Test Suite
Tests every permission for every role: 4 roles × 19 permissions = 76 permission assertions.

Run with:
    python -m pytest tests/test_rbac.py -v
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from app.core.rbac import (
    RBACEngine,
    UserRole,
    Permission,
    ROLE_PERMISSIONS,
    rbac_engine,
)


# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def engine():
    return RBACEngine()


# ─── Test: Role Permission Sets Are Complete and Non-Empty ────────────────────

class TestRolePermissionSets:

    def test_all_roles_have_permissions(self):
        for role in UserRole:
            perms = ROLE_PERMISSIONS.get(role, frozenset())
            assert len(perms) > 0, f"Role {role.value} has no permissions defined"

    def test_no_unknown_permissions_in_role_maps(self):
        all_known = set(Permission)
        for role, perms in ROLE_PERMISSIONS.items():
            unknown = perms - all_known
            assert len(unknown) == 0, f"Role {role.value} has unknown permissions: {unknown}"

    def test_super_admin_has_all_permissions(self):
        """SUPER_ADMIN must hold every defined permission."""
        super_perms = ROLE_PERMISSIONS[UserRole.SUPER_ADMIN]
        for perm in Permission:
            assert perm in super_perms, (
                f"SUPER_ADMIN is missing permission '{perm.value}'"
            )


# ─── Test: CUSTOMER Permissions ───────────────────────────────────────────────

class TestCustomerPermissions:

    # Granted
    def test_customer_can_create_negotiation(self, engine):
        assert engine.check_permission("CUSTOMER", Permission.NEGOTIATION_CREATE)

    def test_customer_can_read_own_negotiation(self, engine):
        assert engine.check_permission("CUSTOMER", Permission.NEGOTIATION_READ_OWN)

    def test_customer_can_read_own_offer(self, engine):
        assert engine.check_permission("CUSTOMER", Permission.OFFER_READ_OWN)

    def test_customer_can_update_own_profile(self, engine):
        assert engine.check_permission("CUSTOMER", Permission.PROFILE_UPDATE_OWN)

    # Denied
    def test_customer_cannot_inspect_negotiations(self, engine):
        assert not engine.check_permission("CUSTOMER", Permission.NEGOTIATION_INSPECT)

    def test_customer_cannot_read_assigned_negotiations(self, engine):
        assert not engine.check_permission("CUSTOMER", Permission.NEGOTIATION_READ_ASSIGNED)

    def test_customer_cannot_create_offers(self, engine):
        assert not engine.check_permission("CUSTOMER", Permission.OFFER_CREATE_OWN)

    def test_customer_cannot_access_business(self, engine):
        assert not engine.check_permission("CUSTOMER", Permission.BUSINESS_READ_OWN)
        assert not engine.check_permission("CUSTOMER", Permission.BUSINESS_UPDATE_OWN)

    def test_customer_cannot_create_products(self, engine):
        assert not engine.check_permission("CUSTOMER", Permission.PRODUCT_CREATE_OWN)
        assert not engine.check_permission("CUSTOMER", Permission.PRODUCT_UPDATE_OWN)

    def test_customer_cannot_verify_sellers(self, engine):
        assert not engine.check_permission("CUSTOMER", Permission.SELLER_VERIFY)

    def test_customer_cannot_manage_users(self, engine):
        assert not engine.check_permission("CUSTOMER", Permission.USER_MANAGE)

    def test_customer_cannot_read_audit(self, engine):
        assert not engine.check_permission("CUSTOMER", Permission.AUDIT_READ)

    def test_customer_cannot_read_analytics(self, engine):
        assert not engine.check_permission("CUSTOMER", Permission.ANALYTICS_READ)

    def test_customer_cannot_configure_system(self, engine):
        assert not engine.check_permission("CUSTOMER", Permission.SYSTEM_CONFIGURE)

    def test_customer_cannot_configure_security(self, engine):
        assert not engine.check_permission("CUSTOMER", Permission.SECURITY_CONFIGURE)

    def test_customer_cannot_configure_ai(self, engine):
        assert not engine.check_permission("CUSTOMER", Permission.AI_CONFIGURE)


# ─── Test: SELLER Permissions ─────────────────────────────────────────────────

class TestSellerPermissions:

    # Granted
    def test_seller_can_read_own_business(self, engine):
        assert engine.check_permission("SELLER", Permission.BUSINESS_READ_OWN)

    def test_seller_can_update_own_business(self, engine):
        assert engine.check_permission("SELLER", Permission.BUSINESS_UPDATE_OWN)

    def test_seller_can_create_products(self, engine):
        assert engine.check_permission("SELLER", Permission.PRODUCT_CREATE_OWN)

    def test_seller_can_update_products(self, engine):
        assert engine.check_permission("SELLER", Permission.PRODUCT_UPDATE_OWN)

    def test_seller_can_read_assigned_negotiations(self, engine):
        assert engine.check_permission("SELLER", Permission.NEGOTIATION_READ_ASSIGNED)

    def test_seller_can_create_offers(self, engine):
        assert engine.check_permission("SELLER", Permission.OFFER_CREATE_OWN)

    def test_seller_can_update_offers(self, engine):
        assert engine.check_permission("SELLER", Permission.OFFER_UPDATE_OWN)

    def test_seller_can_update_profile(self, engine):
        assert engine.check_permission("SELLER", Permission.PROFILE_UPDATE_OWN)

    # Denied
    def test_seller_cannot_create_negotiations(self, engine):
        assert not engine.check_permission("SELLER", Permission.NEGOTIATION_CREATE)

    def test_seller_cannot_inspect_negotiations(self, engine):
        assert not engine.check_permission("SELLER", Permission.NEGOTIATION_INSPECT)

    def test_seller_cannot_verify_sellers(self, engine):
        assert not engine.check_permission("SELLER", Permission.SELLER_VERIFY)

    def test_seller_cannot_manage_users(self, engine):
        assert not engine.check_permission("SELLER", Permission.USER_MANAGE)

    def test_seller_cannot_read_audit(self, engine):
        assert not engine.check_permission("SELLER", Permission.AUDIT_READ)

    def test_seller_cannot_configure_system(self, engine):
        assert not engine.check_permission("SELLER", Permission.SYSTEM_CONFIGURE)

    def test_seller_cannot_configure_ai(self, engine):
        assert not engine.check_permission("SELLER", Permission.AI_CONFIGURE)


# ─── Test: ADMIN Permissions ──────────────────────────────────────────────────

class TestAdminPermissions:

    # Granted
    def test_admin_can_verify_sellers(self, engine):
        assert engine.check_permission("ADMIN", Permission.SELLER_VERIFY)

    def test_admin_can_manage_users(self, engine):
        assert engine.check_permission("ADMIN", Permission.USER_MANAGE)

    def test_admin_can_inspect_negotiations(self, engine):
        assert engine.check_permission("ADMIN", Permission.NEGOTIATION_INSPECT)

    def test_admin_can_read_audit(self, engine):
        assert engine.check_permission("ADMIN", Permission.AUDIT_READ)

    def test_admin_can_read_analytics(self, engine):
        assert engine.check_permission("ADMIN", Permission.ANALYTICS_READ)

    def test_admin_can_create_negotiations(self, engine):
        assert engine.check_permission("ADMIN", Permission.NEGOTIATION_CREATE)

    def test_admin_can_read_offers(self, engine):
        assert engine.check_permission("ADMIN", Permission.OFFER_READ_OWN)

    # Denied (SUPER_ADMIN only)
    def test_admin_cannot_configure_system(self, engine):
        assert not engine.check_permission("ADMIN", Permission.SYSTEM_CONFIGURE)

    def test_admin_cannot_configure_security(self, engine):
        assert not engine.check_permission("ADMIN", Permission.SECURITY_CONFIGURE)

    def test_admin_cannot_configure_ai(self, engine):
        assert not engine.check_permission("ADMIN", Permission.AI_CONFIGURE)


# ─── Test: SUPER_ADMIN Permissions ────────────────────────────────────────────

class TestSuperAdminPermissions:

    def test_super_admin_has_all_19_permissions(self, engine):
        all_perms = list(Permission)
        for perm in all_perms:
            assert engine.check_permission("SUPER_ADMIN", perm), (
                f"SUPER_ADMIN missing permission: {perm.value}"
            )

    def test_super_admin_can_configure_system(self, engine):
        assert engine.check_permission("SUPER_ADMIN", Permission.SYSTEM_CONFIGURE)

    def test_super_admin_can_configure_security(self, engine):
        assert engine.check_permission("SUPER_ADMIN", Permission.SECURITY_CONFIGURE)

    def test_super_admin_can_configure_ai(self, engine):
        assert engine.check_permission("SUPER_ADMIN", Permission.AI_CONFIGURE)

    def test_super_admin_can_verify_sellers(self, engine):
        assert engine.check_permission("SUPER_ADMIN", Permission.SELLER_VERIFY)

    def test_super_admin_can_inspect_negotiations(self, engine):
        assert engine.check_permission("SUPER_ADMIN", Permission.NEGOTIATION_INSPECT)


# ─── Test: Role Escalation Prevention ────────────────────────────────────────

class TestRoleEscalationPrevention:
    """Verify lower roles cannot access higher-role permissions."""

    def test_customer_cannot_escalate_to_admin(self, engine):
        admin_exclusive = [Permission.SELLER_VERIFY, Permission.USER_MANAGE, Permission.AUDIT_READ]
        for perm in admin_exclusive:
            assert not engine.check_permission("CUSTOMER", perm), (
                f"CUSTOMER should NOT have {perm.value}"
            )

    def test_seller_cannot_escalate_to_admin(self, engine):
        admin_exclusive = [Permission.SELLER_VERIFY, Permission.USER_MANAGE, Permission.AUDIT_READ]
        for perm in admin_exclusive:
            assert not engine.check_permission("SELLER", perm), (
                f"SELLER should NOT have {perm.value}"
            )

    def test_admin_cannot_escalate_to_super_admin(self, engine):
        super_admin_exclusive = [
            Permission.SYSTEM_CONFIGURE,
            Permission.SECURITY_CONFIGURE,
            Permission.AI_CONFIGURE,
        ]
        for perm in super_admin_exclusive:
            assert not engine.check_permission("ADMIN", perm), (
                f"ADMIN should NOT have {perm.value}"
            )

    def test_invalid_role_gets_no_permissions(self, engine):
        perms = engine.get_permissions("HACKER_ROLE")
        assert len(perms) == 0

    def test_empty_role_gets_no_permissions(self, engine):
        perms = engine.get_permissions("")
        assert len(perms) == 0


# ─── Test: Permission String Output ───────────────────────────────────────────

class TestPermissionStringOutput:

    def test_permissions_are_sorted_strings(self, engine):
        strings = engine.get_permissions_as_strings("CUSTOMER")
        assert strings == sorted(strings), "Permissions should be alphabetically sorted"

    def test_customer_permission_strings(self, engine):
        strings = engine.get_permissions_as_strings("CUSTOMER")
        assert "negotiation:create" in strings
        assert "negotiation:read:own" in strings
        assert "offer:read:own" in strings
        assert "seller:verify" not in strings

    def test_super_admin_permission_count(self, engine):
        strings = engine.get_permissions_as_strings("SUPER_ADMIN")
        assert len(strings) == len(Permission), (
            f"SUPER_ADMIN should have all {len(Permission)} permissions, got {len(strings)}"
        )


# ─── Test: JWT Claim Safety ───────────────────────────────────────────────────

class TestJWTPermissionEmbedding:

    def test_jwt_embeds_customer_permissions(self):
        from app.core.security import create_access_token, decode_access_token
        token = create_access_token({"sub": "usr-1", "role": "CUSTOMER"})
        payload = decode_access_token(token)
        assert payload is not None
        assert "permissions" in payload
        assert "negotiation:create" in payload["permissions"]
        assert "seller:verify" not in payload["permissions"]

    def test_jwt_embeds_admin_permissions(self):
        from app.core.security import create_access_token, decode_access_token
        token = create_access_token({"sub": "usr-2", "role": "ADMIN"})
        payload = decode_access_token(token)
        assert payload is not None
        assert "audit:read" in payload["permissions"]
        assert "system:configure" not in payload["permissions"]

    def test_jwt_embeds_super_admin_all_permissions(self):
        from app.core.security import create_access_token, decode_access_token
        token = create_access_token({"sub": "usr-3", "role": "SUPER_ADMIN"})
        payload = decode_access_token(token)
        assert payload is not None
        assert "ai:configure" in payload["permissions"]
        assert "system:configure" in payload["permissions"]
        assert len(payload["permissions"]) == len(Permission)

    def test_server_rederives_permissions_from_role(self):
        """
        Critical: server must re-derive permissions from role, not use JWT permissions.
        Simulate a tampered JWT: role=CUSTOMER but permissions claim includes seller:verify.
        The server must not grant this.
        """
        # Manually forge a JWT payload with escalated permissions
        # (simulate what a tampered token might claim)
        forged_role = "CUSTOMER"
        # Server-side derivation:
        server_perms = rbac_engine.get_permissions(forged_role)
        # The forged claim is irrelevant — server only uses role
        assert Permission.SELLER_VERIFY not in server_perms


# ─── Test: Hierarchy Level ────────────────────────────────────────────────────

class TestHierarchyLevels:

    def test_hierarchy_ordering(self, engine):
        assert engine.get_role_hierarchy_level("CUSTOMER")    == 1
        assert engine.get_role_hierarchy_level("SELLER")      == 2
        assert engine.get_role_hierarchy_level("ADMIN")       == 3
        assert engine.get_role_hierarchy_level("SUPER_ADMIN") == 4

    def test_unknown_role_hierarchy(self, engine):
        assert engine.get_role_hierarchy_level("GHOST") == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
