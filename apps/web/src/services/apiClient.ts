/**
 * Panchayat AI — Typed API Client
 * Connects frontend to FastAPI backend with retry logic, structured error handling,
 * and full endpoint coverage for all 4 portals.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';
const DEMO_MODE = import.meta.env.ENABLE_DEMO_MODE !== 'false';

export interface ToolExecutionRequest {
  tool_name: string;
  arguments: Record<string, unknown>;
  user_id?: string;
  user_role?: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  session_id: string;
}

export interface ToolExecutionResult {
  call_id: string;
  tool_name: string;
  status: 'SUCCESS' | 'VALIDATION_ERROR' | 'AUTHORIZATION_ERROR' | 'EXECUTION_ERROR';
  result: Record<string, unknown>;
  audit_event_id: string;
  latency_ms: number;
}

export interface FactBusEvent {
  event_id: string;
  event_type: string;
  timestamp: string;
  actor_type: string;
  actor_id: string;
  session_id: string;
  source: string;
  payload: Record<string, unknown>;
}

export interface SystemHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  service: string;
  timestamp: string;
  components: {
    database: { status: string; latency_ms?: number };
    ai_engine: { status: string; tools_registered?: number };
    websocket: { status: string };
  };
}

export interface MarketStatistics {
  category: string;
  average_market_price: number;
  lowest_verified_offer: number;
  active_sellers: number;
  negotiation_success_rate: string;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public endpoint: string
  ) {
    super(`API Error [${status}] on ${endpoint}: ${detail}`);
  }
}

async function fetchWithRetry<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 2
): Promise<T> {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const url = `${API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-ID': requestId,
    ...(options.headers as Record<string, string> ?? {}),
  };

  // Attach JWT if available
  const token = localStorage.getItem('panchayat_ai_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { ...options, headers });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: res.statusText }));
        throw new ApiError(res.status, body.detail ?? res.statusText, endpoint);
      }

      return res.json() as Promise<T>;
    } catch (err) {
      lastError = err as Error;
      if (attempt < retries && !(err instanceof ApiError && err.status < 500)) {
        await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
        continue;
      }
      break;
    }
  }

  throw lastError;
}

// ─── AI Tool Calling ────────────────────────────────────────────────────────

export const aiApi = {
  /** List all 13 registered AI tools */
  listTools: () =>
    fetchWithRetry<{ count: number; tools: string[] }>('/v1/ai/tools'),

  /** Execute an AI tool through the strict 6-Step Pipeline */
  executeToolCall: (req: ToolExecutionRequest) =>
    fetchWithRetry<ToolExecutionResult>('/v1/ai/tool-call/execute', {
      method: 'POST',
      body: JSON.stringify(req),
    }),
};

// ─── Fact Bus ────────────────────────────────────────────────────────────────

export const factBusApi = {
  /** Get immutable event stream for a session */
  getEvents: (sessionId: string) =>
    fetchWithRetry<{ session_id: string; events: FactBusEvent[]; count: number }>(
      `/v1/fact-bus/events/${sessionId}`
    ),

  /** Get materialized session state (replayed from events) */
  getMaterializedState: (sessionId: string) =>
    fetchWithRetry<Record<string, unknown>>(`/v1/fact-bus/state/${sessionId}`),

  /** Publish an event to the immutable Fact Bus */
  publishEvent: (payload: {
    event_type: string;
    actor_type: string;
    actor_id: string;
    session_id: string;
    source: string;
    payload: Record<string, unknown>;
  }) =>
    fetchWithRetry<FactBusEvent>('/v1/fact-bus/publish', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// ─── Market / Seller Discovery ───────────────────────────────────────────────

export const marketApi = {
  /** Fetch nearby real sellers from Google Places */
  getNearbyRealSellers: (lat: number, lng: number, radius = 5000, category = 'Electronics') =>
    fetchWithRetry<Record<string, unknown>>(
      `/v1/market/nearby-sellers?latitude=${lat}&longitude=${lng}&radius=${radius}&category=${encodeURIComponent(category)}`
    ),

  /** Get market statistics for a category */
  getMarketStatistics: (category: string) =>
    aiApi.executeToolCall({
      tool_name: 'get_market_statistics',
      arguments: { category },
      session_id: `stats-${Date.now()}`,
      user_role: 'CUSTOMER',
    }),
};

// ─── Negotiation ─────────────────────────────────────────────────────────────

export const negotiationApi = {
  start: (requirement: Record<string, unknown>) =>
    fetchWithRetry<Record<string, unknown>>('/negotiation/start', {
      method: 'POST',
      body: JSON.stringify(requirement),
    }),

  step: () =>
    fetchWithRetry<{ hasMore: boolean; session: Record<string, unknown> }>('/negotiation/step', {
      method: 'POST',
    }),

  fastForward: () =>
    fetchWithRetry<Record<string, unknown>>('/negotiation/fast-forward', {
      method: 'POST',
    }),

  getSession: () =>
    fetchWithRetry<Record<string, unknown>>('/fact-bus/session'),

  startReal: (payload: {
    session_id: string;
    customer_id: string;
    seller_id: string;
    proposed_price: number;
    channel?: string;
  }) =>
    fetchWithRetry<Record<string, unknown>>('/v1/negotiation/real/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// ─── Requirements Analysis ───────────────────────────────────────────────────

export const requirementApi = {
  analyze: (prompt: string, language = 'en') =>
    fetchWithRetry<Record<string, unknown>>('/requirements/analyze', {
      method: 'POST',
      body: JSON.stringify({ prompt, language }),
    }),
};

// ─── System Health ────────────────────────────────────────────────────────────

export const healthApi = {
  /** Check overall system health (no auth required) */
  getHealth: () =>
    fetchWithRetry<SystemHealth>('/health').catch((): SystemHealth => ({
      status: 'OFFLINE',
      service: 'Panchayat AI API Engine',
      timestamp: new Date().toISOString(),
      components: {
        database: { status: 'OFFLINE' },
        ai_engine: { status: 'OFFLINE' },
        websocket: { status: 'OFFLINE' },
      },
    })),
};

// ─── Location Service ─────────────────────────────────────────────────────────

export interface ReverseGeocodeResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
  locality?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}

export interface LocationSessionPayload {
  latitude: number;
  longitude: number;
  accuracy_meters: number;
  timestamp: string;
  source: 'GPS_BROWSER' | 'MANUAL_USER_INPUT' | 'IP_APPROXIMATE';
  persist_precise?: boolean;
}

export interface LocationSessionResponse {
  location_session_id: string;
  status: 'READY';
  source: string;
  coordinates: {
    latitude: number;
    longitude: number;
    accuracy_meters: number;
  };
  persisted_record: {
    latitude: number;
    longitude: number;
    is_precise: boolean;
  };
  approx_address: string;
  locality?: string;
  city?: string;
  state?: string;
  captured_at: string;
}

export const locationApi = {
  reverseGeocode: (lat: number, lng: number) =>
    fetchWithRetry<ReverseGeocodeResult>(`/v1/location/reverse-geocode?latitude=${lat}&longitude=${lng}`),

  createSession: (payload: LocationSessionPayload) =>
    fetchWithRetry<LocationSessionResponse>('/v1/location/session', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// ─── Seller Onboarding & Connection ──────────────────────────────────────────

export interface SellerInvitePayload {
  place_id: string;
  place_name: string;
  contact_phone_or_email: string;
  invited_by_customer_id?: string;
}

export interface SellerClaimPayload {
  place_id: string;
  seller_name: string;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
}

export interface SellerVerificationPayload {
  claim_id: string;
  verification_code: string;
}

export interface SellerConfigPayload {
  seller_id: string;
  place_id: string;
  products?: Record<string, unknown>[];
  current_prices?: Record<string, number>;
  inventory_status?: string;
  negotiable?: boolean;
  minimum_acceptable_price: number;
  max_negotiation_rounds?: number;
  warranty?: string;
  pickup_or_delivery?: string;
  allowed_languages?: string[];
  ai_negotiation_enabled: boolean;
  approval_required_for_final_offer?: boolean;
}

export const sellerOnboardingApi = {
  checkConnectionStatus: (placeId: string) =>
    fetchWithRetry<{
      seller_id?: string;
      place_id: string;
      seller_name?: string;
      connection_status: string;
      is_connected: boolean;
      ai_negotiation_enabled: boolean;
      message: string;
    }>(`/v1/sellers/check-connection/${placeId}`),

  inviteSeller: (payload: SellerInvitePayload) =>
    fetchWithRetry<{ invite_id: string; place_id: string; status: string; message: string }>('/v1/sellers/invite', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  claimAccount: (payload: SellerClaimPayload) =>
    fetchWithRetry<{ claim_id: string; place_id: string; status: string; verification_code_demo: string; message: string }>('/v1/sellers/claim', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyClaim: (payload: SellerVerificationPayload) =>
    fetchWithRetry<{ seller_id: string; place_id: string; connection_status: string; message: string }>('/v1/sellers/verify-claim', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateConfig: (payload: SellerConfigPayload) =>
    fetchWithRetry<{ place_id: string; connection_status: string; ai_negotiation_enabled: boolean; minimum_acceptable_price: number; message: string }>('/v1/sellers/config', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};


// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminApi = {
  resetDemo: () =>
    fetchWithRetry<Record<string, unknown>>('/demo/reset', { method: 'POST' }),

  advanceDemoStep: () =>
    fetchWithRetry<Record<string, unknown>>('/demo/step', { method: 'POST' }),
};

export { DEMO_MODE };
