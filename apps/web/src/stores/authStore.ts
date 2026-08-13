export type UserRole = 'CUSTOMER' | 'SELLER' | 'ADMIN';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  location?: string;
  created_at?: string;
}

export class AuthStore {
  private user: UserProfile | null = null;
  private token: string | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('panchayat_jwt');
      const savedUser = localStorage.getItem('panchayat_user');
      if (savedToken && savedUser) {
        try {
          this.token = savedToken;
          this.user = JSON.parse(savedUser);
        } catch (e) {
          this.clearSession();
        }
      }
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public setSession(token: string, user: UserProfile) {
    this.token = token;
    this.user = user;
    if (typeof window !== 'undefined') {
      localStorage.setItem('panchayat_jwt', token);
      localStorage.setItem('panchayat_user', JSON.stringify(user));
    }
    this.notify();
  }

  public clearSession() {
    this.token = null;
    this.user = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('panchayat_jwt');
      localStorage.removeItem('panchayat_user');
    }
    this.notify();
  }

  public getUser(): UserProfile | null {
    return this.user;
  }

  public getToken(): string | null {
    return this.token;
  }

  public isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  public hasRole(role: UserRole): boolean {
    if (!this.user) return false;
    if (this.user.role === 'ADMIN') return true;
    return this.user.role === role;
  }
}

export const authStore = new AuthStore();
