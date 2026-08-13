/**
 * usePermission — React hook for permission-based UI rendering
 *
 * PURPOSE: Show/hide UI elements based on the current user's permissions.
 * SECURITY NOTE: This is for UX ONLY. The API always enforces authorization
 * independently. A clever user who bypasses the UI still hits 403 from the server.
 *
 * Usage:
 *   const { granted } = usePermission('negotiation:create');
 *   if (!granted) return null;
 */

import { useEffect, useState } from 'react';
import { authStore } from '../stores/authStore';
import type { Permission, UserRole } from '../stores/authStore';

export interface UsePermissionResult {
  /** Whether the current user has this permission */
  granted: boolean;
  /** Whether a user is authenticated at all */
  authenticated: boolean;
  /** The current user's role, or null if not authenticated */
  role: UserRole | null;
}

/** Check a single permission */
export function usePermission(permission: Permission): UsePermissionResult {
  const [result, setResult] = useState<UsePermissionResult>(() => ({
    granted: authStore.hasPermission(permission),
    authenticated: authStore.isAuthenticated(),
    role: authStore.getUser()?.role ?? null,
  }));

  useEffect(() => {
    const unsub = authStore.subscribe(() => {
      setResult({
        granted: authStore.hasPermission(permission),
        authenticated: authStore.isAuthenticated(),
        role: authStore.getUser()?.role ?? null,
      });
    });
    return unsub;
  }, [permission]);

  return result;
}

/** Check multiple permissions — returns true if user has ALL of them */
export function useAllPermissions(permissions: Permission[]): UsePermissionResult {
  const [result, setResult] = useState<UsePermissionResult>(() => ({
    granted: authStore.hasAllPermissions(permissions),
    authenticated: authStore.isAuthenticated(),
    role: authStore.getUser()?.role ?? null,
  }));

  useEffect(() => {
    const unsub = authStore.subscribe(() => {
      setResult({
        granted: authStore.hasAllPermissions(permissions),
        authenticated: authStore.isAuthenticated(),
        role: authStore.getUser()?.role ?? null,
      });
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissions.join(',')]);

  return result;
}

/** Check multiple permissions — returns true if user has ANY of them */
export function useAnyPermission(permissions: Permission[]): UsePermissionResult {
  const [result, setResult] = useState<UsePermissionResult>(() => ({
    granted: authStore.hasAnyPermission(permissions),
    authenticated: authStore.isAuthenticated(),
    role: authStore.getUser()?.role ?? null,
  }));

  useEffect(() => {
    const unsub = authStore.subscribe(() => {
      setResult({
        granted: authStore.hasAnyPermission(permissions),
        authenticated: authStore.isAuthenticated(),
        role: authStore.getUser()?.role ?? null,
      });
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissions.join(',')]);

  return result;
}

/** Check minimum role level */
export function useRoleAtLeast(role: UserRole): UsePermissionResult {
  const [result, setResult] = useState<UsePermissionResult>(() => ({
    granted: authStore.hasRoleAtLeast(role),
    authenticated: authStore.isAuthenticated(),
    role: authStore.getUser()?.role ?? null,
  }));

  useEffect(() => {
    const unsub = authStore.subscribe(() => {
      setResult({
        granted: authStore.hasRoleAtLeast(role),
        authenticated: authStore.isAuthenticated(),
        role: authStore.getUser()?.role ?? null,
      });
    });
    return unsub;
  }, [role]);

  return result;
}
