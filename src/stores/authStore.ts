// ─── Role & Permission Types ──────────────────────────────────────────────────

export type UserRole = 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN';

/**
 * All permission strings — mirrored from backend rbac.py Permission enum.
 * These are for CLIENT UX ONLY (show/hide UI elements).
 * The API always enforces permissions independently — never rely on this for security.
 */
export type Permission =
  // Negotiation
  | 'negotiation:create'
  | 'negotiation:read:own'
  | 'negotiation:read:assigned'
  | 'negotiation:inspect'
  // Offers
  | 'offer:read:own'
  | 'offer:create:own'
  | 'offer:update:own'
  // Profile
  | 'profile:update:own'
  // Business
  | 'business:read:own'
  | 'business:update:own'
  // Products
  | 'product:create:own'
  | 'product:update:own'
  // Admin
  | 'seller:verify'
  | 'user:manage'
  | 'audit:read'
  | 'analytics:read'
  // Super Admin
  | 'system:configure'
  | 'security:configure'
  | 'ai:configure';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  location?: string;
  created_at?: string;
  /** Permission strings from server — for client UX only, NOT for security decisions */
  permissions: Permission[];
}

// ─── Canonical Client-side Role→Permission Mapping ────────────────────────────
// Mirrors backend rbac.py ROLE_PERMISSIONS exactly.
// Used as fallback if the server doesn't return permissions (e.g. older JWT).
// UX ONLY — API always enforces independently.

const ROLE_PERMISSIONS_CLIENT: Record<UserRole, Permission[]> = {
  CUSTOMER: [
    'negotiation:create',
    'negotiation:read:own',
    'offer:read:own',
    'profile:update:own',
  ],
  SELLER: [
    'business:read:own',
    'business:update:own',
    'product:create:own',
    'product:update:own',
    'negotiation:read:assigned',
    'offer:create:own',
    'offer:update:own',
    'profile:update:own',
  ],
  ADMIN: [
    'seller:verify',
    'user:manage',
    'negotiation:inspect',
    'audit:read',
    'analytics:read',
    'negotiation:create',
    'negotiation:read:own',
    'offer:read:own',
  ],
  SUPER_ADMIN: [
    'seller:verify',
    'user:manage',
    'negotiation:inspect',
    'audit:read',
    'analytics:read',
    'negotiation:create',
    'negotiation:read:own',
    'offer:read:own',
    'profile:update:own',
    'business:read:own',
    'business:update:own',
    'product:create:own',
    'product:update:own',
    'negotiation:read:assigned',
    'offer:create:own',
    'offer:update:own',
    'system:configure',
    'security:configure',
    'ai:configure',
  ],
};

// ─── Role Hierarchy Levels ────────────────────────────────────────────────────

const ROLE_LEVELS: Record<UserRole, number> = {
  CUSTOMER:    1,
  SELLER:      2,
  ADMIN:       3,
  SUPER_ADMIN: 4,
};


// ─── Auth Store ───────────────────────────────────────────────────────────────

export class AuthStore {
  private user: UserProfile | null = null;
  private token: string | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('panchayat_jwt');
      const savedUser  = localStorage.getItem('panchayat_user');
      if (savedToken && savedUser) {
        try {
          this.token = savedToken;
          this.user  = JSON.parse(savedUser) as UserProfile;
          // Backfill permissions if missing (older JWT / session)
          if (!this.user.permissions) {
            this.user.permissions = ROLE_PERMISSIONS_CLIENT[this.user.role] ?? [];
          }
        } catch {
          this.clearSession();
        }
      }
    }
  }

  // ─── Subscriptions ─────────────────────────────────────────────────────────

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // ─── Session Management ────────────────────────────────────────────────────

  public setSession(token: string, user: UserProfile) {
    // Always backfill permissions from the canonical client map if not provided
    if (!user.permissions || user.permissions.length === 0) {
      user.permissions = ROLE_PERMISSIONS_CLIENT[user.role] ?? [];
    }
    this.token = token;
    this.user  = user;
    if (typeof window !== 'undefined') {
      localStorage.setItem('panchayat_jwt', token);
      localStorage.setItem('panchayat_user', JSON.stringify(user));
    }
    this.notify();
  }

  public clearSession() {
    this.token = null;
    this.user  = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('panchayat_jwt');
      localStorage.removeItem('panchayat_user');
      localStorage.removeItem('panchayat_ai_token'); // legacy key
    }
    this.notify();
  }

  // ─── Getters ───────────────────────────────────────────────────────────────

  public getUser(): UserProfile | null {
    return this.user;
  }

  public getToken(): string | null {
    return this.token;
  }

  public isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  // ─── Authorization Helpers (UX ONLY) ──────────────────────────────────────
  // These are for showing/hiding UI elements.
  // The API ALWAYS enforces authorization independently.

  /**
   * Check if the authenticated user has a specific permission.
   * UX ONLY — not a security boundary.
   */
  public hasPermission(permission: Permission): boolean {
    if (!this.user) return false;

    // Use server-provided permissions if available
    if (this.user.permissions && this.user.permissions.length > 0) {
      return this.user.permissions.includes(permission);
    }

    // Fallback: derive from canonical client map
    return (ROLE_PERMISSIONS_CLIENT[this.user.role] ?? []).includes(permission);
  }

  /**
   * Check if user has ALL of the given permissions.
   * UX ONLY.
   */
  public hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every((p) => this.hasPermission(p));
  }

  /**
   * Check if user has ANY of the given permissions.
   * UX ONLY.
   */
  public hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some((p) => this.hasPermission(p));
  }

  /**
   * Check if the user has a specific role.
   * UX ONLY.
   */
  public hasRole(role: UserRole): boolean {
    if (!this.user) return false;
    return this.user.role === role;
  }

  /**
   * Check if user's role is at least the given level.
   * SUPER_ADMIN ≥ ADMIN ≥ SELLER ≥ CUSTOMER
   * UX ONLY.
   */
  public hasRoleAtLeast(role: UserRole): boolean {
    if (!this.user) return false;
    return (ROLE_LEVELS[this.user.role] ?? 0) >= (ROLE_LEVELS[role] ?? 0);
  }

  /**
   * Returns the user's role hierarchy level (1-4).
   * UX ONLY.
   */
  public getRoleLevel(): number {
    if (!this.user) return 0;
    return ROLE_LEVELS[this.user.role] ?? 0;
  }
}

export const authStore = new AuthStore();
