/**
 * PermissionGate — Declarative permission-based UI rendering
 *
 * SECURITY NOTE: This component is for USER EXPERIENCE ONLY.
 * It shows/hides children based on the current user's client-side permissions.
 * The API always enforces authorization independently on every request.
 * Never use this as a security boundary.
 *
 * Usage:
 *   // Render only if user has 'negotiation:create'
 *   <PermissionGate permission="negotiation:create">
 *     <StartNegotiationButton />
 *   </PermissionGate>
 *
 *   // Render fallback if permission denied
 *   <PermissionGate
 *     permission="seller:verify"
 *     fallback={<p>Contact an administrator.</p>}
 *   >
 *     <VerifySellerButton />
 *   </PermissionGate>
 *
 *   // Require authentication first
 *   <PermissionGate permission="offer:create:own" requireAuth>
 *     <PlaceBidButton />
 *   </PermissionGate>
 */

import React from 'react';
import { usePermission, useAnyPermission, useAllPermissions } from '../hooks/usePermission';
import type { Permission } from '../stores/authStore';
import { Lock } from 'lucide-react';

// ─── Single Permission Gate ────────────────────────────────────────────────────

interface PermissionGateProps {
  /** The required permission string */
  permission: Permission;
  /** Content to render when permission is granted */
  children: React.ReactNode;
  /** Content to render when permission is denied (default: null) */
  fallback?: React.ReactNode;
  /** If true, shows a locked UI hint when denied (useful for demo/showcase) */
  showLocked?: boolean;
  /** If true, requires the user to be authenticated even if permission isn't needed */
  requireAuth?: boolean;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  children,
  fallback = null,
  showLocked = false,
  requireAuth = false,
}) => {
  const { granted, authenticated } = usePermission(permission);

  if (requireAuth && !authenticated) {
    return showLocked ? <LockedUI reason="Sign in required" /> : <>{fallback}</>;
  }

  if (!granted) {
    return showLocked ? <LockedUI reason={`Requires: ${permission}`} /> : <>{fallback}</>;
  }

  return <>{children}</>;
};

// ─── Any-Permission Gate ───────────────────────────────────────────────────────

interface AnyPermissionGateProps {
  permissions: Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLocked?: boolean;
}

export const AnyPermissionGate: React.FC<AnyPermissionGateProps> = ({
  permissions,
  children,
  fallback = null,
  showLocked = false,
}) => {
  const { granted } = useAnyPermission(permissions);
  if (!granted) {
    return showLocked ? <LockedUI reason={`Requires one of: ${permissions.join(', ')}`} /> : <>{fallback}</>;
  }
  return <>{children}</>;
};

// ─── All-Permissions Gate ──────────────────────────────────────────────────────

interface AllPermissionsGateProps {
  permissions: Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AllPermissionsGate: React.FC<AllPermissionsGateProps> = ({
  permissions,
  children,
  fallback = null,
}) => {
  const { granted } = useAllPermissions(permissions);
  if (!granted) return <>{fallback}</>;
  return <>{children}</>;
};

// ─── Admin Gate (shorthand) ────────────────────────────────────────────────────

interface AdminGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  superAdminOnly?: boolean;
}

export const AdminGate: React.FC<AdminGateProps> = ({
  children,
  fallback = null,
  superAdminOnly = false,
}) => {
  const permission: Permission = superAdminOnly ? 'system:configure' : 'audit:read';
  const { granted } = usePermission(permission);
  if (!granted) return <>{fallback}</>;
  return <>{children}</>;
};

// ─── Locked UI Indicator ──────────────────────────────────────────────────────

interface LockedUIProps {
  reason?: string;
}

const LockedUI: React.FC<LockedUIProps> = ({ reason }) => (
  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/50 border border-slate-700/50 text-[10px] text-slate-500 cursor-not-allowed select-none">
    <Lock className="w-3 h-3 text-slate-600" />
    <span>{reason ?? 'Insufficient permissions'}</span>
  </div>
);
