"""
Panchayat AI — FastAPI Authorization Dependencies
Layer 2 of the Defense-in-Depth authorization stack.

Each dependency factory creates a FastAPI Depends() callable that:
1. Extracts and verifies the JWT (authentication)
2. Re-derives permissions from role via rbac_engine (NEVER from JWT permissions claim)
3. Asserts the required permission is present (authorization)
4. Returns the authenticated user dict for route handlers

Resource ownership (Layer 3) is NOT handled here — routes that need it
must additionally call functions from app.core.ownership after this check.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any
from app.core.security import decode_access_token
from app.core.database import users_col
from app.core.rbac import rbac_engine, Permission, UserRole

security_bearer = HTTPBearer(auto_error=False)


# ─── Base Authentication ──────────────────────────────────────────────────────

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_bearer)
) -> Dict[str, Any]:
    """
    Extracts and validates the JWT Bearer token.
    Returns authenticated user dict (without password_hash).
    Raises HTTP 401 if token is missing, invalid, or expired.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)

    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload["sub"]
    user = users_col.find_one({"_id": user_id})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with this token no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Sanitize: remove password hash before returning user context
    user["id"] = user.get("_id")
    user.pop("password_hash", None)

    # CRITICAL: Re-derive permissions from role (never use JWT 'permissions' claim)
    role = user.get("role", UserRole.CUSTOMER.value)
    user["_derived_permissions"] = rbac_engine.get_permissions_as_strings(role)

    return user


# ─── Permission-Based Authorization Dependency Factory ────────────────────────

def require_permission(permission: Permission):
    """
    FastAPI dependency factory that enforces a specific permission.

    Usage in routes:
        @router.post("/negotiation/start")
        def start(user = Depends(require_permission(Permission.NEGOTIATION_CREATE))):
            ...

    Raises HTTP 403 if the authenticated user's ROLE lacks the permission.
    Permission is ALWAYS derived from role via rbac_engine — never from JWT.
    """
    def permission_checker(
        current_user: Dict[str, Any] = Depends(get_current_user)
    ) -> Dict[str, Any]:
        role = current_user.get("role", UserRole.CUSTOMER.value)
        if not rbac_engine.check_permission(role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Forbidden: your role '{role}' does not have "
                    f"permission '{permission.value}'"
                ),
            )
        return current_user

    return permission_checker


# ─── Multi-Permission Dependency Factories ────────────────────────────────────

def require_any_permission(*permissions: Permission):
    """
    Dependency factory: user must have AT LEAST ONE of the listed permissions.
    Useful for resources accessible to multiple roles (e.g. SELLER or ADMIN).
    """
    def checker(
        current_user: Dict[str, Any] = Depends(get_current_user)
    ) -> Dict[str, Any]:
        role = current_user.get("role", UserRole.CUSTOMER.value)
        if not rbac_engine.check_any_permission(role, set(permissions)):
            perms_str = ", ".join(p.value for p in permissions)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: requires one of [{perms_str}]",
            )
        return current_user

    return checker


# ─── Convenience Named Dependencies ───────────────────────────────────────────
# These are the public interface used across routes and admin_routes.
# They are implemented via require_permission to ensure consistent enforcement.

get_current_customer = require_permission(Permission.NEGOTIATION_READ_OWN)
get_current_seller   = require_permission(Permission.BUSINESS_READ_OWN)
get_current_admin    = require_permission(Permission.AUDIT_READ)
get_current_super_admin = require_permission(Permission.SYSTEM_CONFIGURE)


# ─── Role-String Convenience Dependency ───────────────────────────────────────

def require_role(role: UserRole):
    """
    Dependency factory: user must have exactly this role (or higher equivalent).
    Prefer require_permission() over this — permissions are more granular.
    Use this only when the entire route is role-scoped (e.g. SELLER-only portal).
    """
    def checker(
        current_user: Dict[str, Any] = Depends(get_current_user)
    ) -> Dict[str, Any]:
        user_role = current_user.get("role", "")
        # SUPER_ADMIN can impersonate any role context
        if user_role == UserRole.SUPER_ADMIN.value:
            return current_user
        if user_role != role.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: route requires role '{role.value}', got '{user_role}'",
            )
        return current_user

    return checker
