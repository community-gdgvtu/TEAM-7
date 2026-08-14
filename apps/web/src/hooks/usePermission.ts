import { useEffect, useState } from 'react';
import { authStore, UserProfile, UserRole } from '../stores/authStore';

export type TabId = 'customer' | 'negotiation' | 'results' | 'seller' | 'admin' | 'command_center';

// Canonical Role -> Permitted Tabs Mapping
const ROLE_PERMITTED_TABS: Record<UserRole, TabId[]> = {
  CUSTOMER: ['customer', 'negotiation', 'results'],
  SELLER: ['seller', 'negotiation', 'results'],
  ADMIN: ['customer', 'negotiation', 'results', 'seller', 'command_center', 'admin'],
};

// Default Landing Tab per Role
const ROLE_DEFAULT_TAB: Record<UserRole, TabId> = {
  CUSTOMER: 'customer',
  SELLER: 'seller',
  ADMIN: 'admin',
};

export function canAccessTab(role: UserRole | undefined | null, tab: TabId): boolean {
  if (!role) return false;
  const allowed = ROLE_PERMITTED_TABS[role] || [];
  return allowed.includes(tab);
}

export function getDefaultTabForRole(role: UserRole | undefined | null): TabId {
  if (!role) return 'customer';
  return ROLE_DEFAULT_TAB[role] || 'customer';
}

export function usePermission() {
  const [user, setUser] = useState<UserProfile | null>(() => authStore.getUser());

  useEffect(() => {
    const unsub = authStore.subscribe(() => {
      setUser(authStore.getUser());
    });
    return unsub;
  }, []);

  const role: UserRole = user?.role || 'CUSTOMER';
  const isAuthenticated = authStore.isAuthenticated();
  const permittedTabs = ROLE_PERMITTED_TABS[role] || [];
  const defaultTab = ROLE_DEFAULT_TAB[role] || 'customer';

  return {
    user,
    role,
    isAuthenticated,
    permittedTabs,
    defaultTab,
    hasRole: (targetRole: UserRole) => authStore.hasRole(targetRole),
    canAccessTab: (tab: TabId) => canAccessTab(role, tab),
  };
}
