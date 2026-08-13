"""
Panchayat AI — Production RBAC Engine
Single source of truth for all roles, permissions, and authorization logic.

DESIGN INVARIANTS:
1. Role→Permission mapping is defined here ONLY. Never duplicated.
2. Server always re-derives permissions from role — JWT permissions are
   for client UX only and are NEVER trusted for server-side authorization.
3. SUPER_ADMIN > ADMIN > SELLER > CUSTOMER in terms of scope, but
   permissions are explicit sets — no implicit "inherits-all" logic.
4. ":own" suffix means the check ALSO requires resource ownership verification.
   Route-level permission check is necessary but not sufficient for :own resources.
"""

from enum import Enum
from typing import Set, Dict, FrozenSet
from fastapi import HTTPException, status


# ─── Role Enum ────────────────────────────────────────────────────────────────

class UserRole(str, Enum):
    CUSTOMER    = "CUSTOMER"
    SELLER      = "SELLER"
    ADMIN       = "ADMIN"
    SUPER_ADMIN = "SUPER_ADMIN"


# ─── Permission Enum ──────────────────────────────────────────────────────────

class Permission(str, Enum):
    # Negotiation
    NEGOTIATION_CREATE         = "negotiation:create"
    NEGOTIATION_READ_OWN       = "negotiation:read:own"
    NEGOTIATION_READ_ASSIGNED  = "negotiation:read:assigned"
    NEGOTIATION_INSPECT        = "negotiation:inspect"

    # Offers
    OFFER_READ_OWN             = "offer:read:own"
    OFFER_CREATE_OWN           = "offer:create:own"
    OFFER_UPDATE_OWN           = "offer:update:own"

    # Profile
    PROFILE_UPDATE_OWN         = "profile:update:own"

    # Business (Seller)
    BUSINESS_READ_OWN          = "business:read:own"
    BUSINESS_UPDATE_OWN        = "business:update:own"

    # Products (Seller)
    PRODUCT_CREATE_OWN         = "product:create:own"
    PRODUCT_UPDATE_OWN         = "product:update:own"

    # Admin Operations
    SELLER_VERIFY              = "seller:verify"
    USER_MANAGE                = "user:manage"
    AUDIT_READ                 = "audit:read"
    ANALYTICS_READ             = "analytics:read"

    # Super Admin Only
    SYSTEM_CONFIGURE           = "system:configure"
    SECURITY_CONFIGURE         = "security:configure"
    AI_CONFIGURE               = "ai:configure"


# ─── Canonical Role → Permission Mapping ──────────────────────────────────────
# This is the single authoritative source. No permission logic anywhere else.

ROLE_PERMISSIONS: Dict[UserRole, FrozenSet[Permission]] = {

    UserRole.CUSTOMER: frozenset({
        Permission.NEGOTIATION_CREATE,
        Permission.NEGOTIATION_READ_OWN,
        Permission.OFFER_READ_OWN,
        Permission.PROFILE_UPDATE_OWN,
    }),

    UserRole.SELLER: frozenset({
        Permission.BUSINESS_READ_OWN,
        Permission.BUSINESS_UPDATE_OWN,
        Permission.PRODUCT_CREATE_OWN,
        Permission.PRODUCT_UPDATE_OWN,
        Permission.NEGOTIATION_READ_ASSIGNED,
        Permission.OFFER_CREATE_OWN,
        Permission.OFFER_UPDATE_OWN,
        Permission.PROFILE_UPDATE_OWN,
    }),

    UserRole.ADMIN: frozenset({
        Permission.SELLER_VERIFY,
        Permission.USER_MANAGE,
        Permission.NEGOTIATION_INSPECT,
        Permission.AUDIT_READ,
        Permission.ANALYTICS_READ,
        # Admins can also read/create negotiations for support purposes
        Permission.NEGOTIATION_CREATE,
        Permission.NEGOTIATION_READ_OWN,
        Permission.OFFER_READ_OWN,
    }),

    UserRole.SUPER_ADMIN: frozenset({
        # Inherits all ADMIN permissions
        Permission.SELLER_VERIFY,
        Permission.USER_MANAGE,
        Permission.NEGOTIATION_INSPECT,
        Permission.AUDIT_READ,
        Permission.ANALYTICS_READ,
        # Plus all user permissions
        Permission.NEGOTIATION_CREATE,
        Permission.NEGOTIATION_READ_OWN,
        Permission.OFFER_READ_OWN,
        Permission.PROFILE_UPDATE_OWN,
        # Plus all seller permissions
        Permission.BUSINESS_READ_OWN,
        Permission.BUSINESS_UPDATE_OWN,
        Permission.PRODUCT_CREATE_OWN,
        Permission.PRODUCT_UPDATE_OWN,
        Permission.NEGOTIATION_READ_ASSIGNED,
        Permission.OFFER_CREATE_OWN,
        Permission.OFFER_UPDATE_OWN,
        # Exclusive SUPER_ADMIN permissions
        Permission.SYSTEM_CONFIGURE,
        Permission.SECURITY_CONFIGURE,
        Permission.AI_CONFIGURE,
    }),
}


# ─── RBAC Engine ──────────────────────────────────────────────────────────────

class RBACEngine:
    """
    Stateless permission evaluation engine.
    All methods are pure functions — no side effects.
    """

    def get_permissions(self, role: str) -> FrozenSet[Permission]:
        """
        Re-derives the canonical permission set from a role string.
        This is called SERVER-SIDE on every protected request.
        The JWT's embedded 'permissions' field is NEVER used for this.
        """
        try:
            user_role = UserRole(role)
        except ValueError:
            return frozenset()
        return ROLE_PERMISSIONS.get(user_role, frozenset())

    def check_permission(self, role: str, permission: Permission) -> bool:
        """Returns True if the given role has the given permission."""
        return permission in self.get_permissions(role)

    def check_any_permission(self, role: str, permissions: Set[Permission]) -> bool:
        """Returns True if the role has ANY of the given permissions."""
        role_perms = self.get_permissions(role)
        return bool(role_perms & permissions)

    def check_all_permissions(self, role: str, permissions: Set[Permission]) -> bool:
        """Returns True if the role has ALL of the given permissions."""
        role_perms = self.get_permissions(role)
        return permissions.issubset(role_perms)

    def assert_permission(
        self,
        role: str,
        permission: Permission,
        resource_context: str = ""
    ) -> None:
        """
        Raises HTTP 403 if role lacks permission.
        Used in service layer (not just routes) to enforce defense in depth.
        """
        if not self.check_permission(role, permission):
            detail = f"Forbidden: role '{role}' lacks permission '{permission.value}'"
            if resource_context:
                detail += f" on resource '{resource_context}'"
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=detail
            )

    def get_permissions_as_strings(self, role: str) -> list[str]:
        """Returns permission strings for JWT embedding (client UX only)."""
        return sorted([p.value for p in self.get_permissions(role)])

    def get_role_hierarchy_level(self, role: str) -> int:
        """
        Returns hierarchy level (higher = more privileged).
        Used only for display and audit purposes, NOT for permission checks.
        """
        levels = {
            UserRole.CUSTOMER.value:    1,
            UserRole.SELLER.value:      2,
            UserRole.ADMIN.value:       3,
            UserRole.SUPER_ADMIN.value: 4,
        }
        return levels.get(role, 0)


# Singleton instance used across the application
rbac_engine = RBACEngine()
