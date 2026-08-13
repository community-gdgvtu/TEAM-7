/**
 * Production-Grade Location Store
 * Manages location states: IDLE, REQUESTING, GRANTED, DENIED, UNAVAILABLE, READY, STALE
 * Enforces privacy-first geolocation, reverse geocoding, and manual selection fallbacks.
 */

import { locationApi, LocationSessionResponse } from '../services/apiClient';

export type LocationStatus =
  | 'IDLE'
  | 'REQUESTING'
  | 'GRANTED'
  | 'DENIED'
  | 'UNAVAILABLE'
  | 'READY'
  | 'STALE';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  formattedAddress: string;
  locality?: string;
  city?: string;
  state?: string;
  source: 'GPS_BROWSER' | 'MANUAL_USER_INPUT' | 'IP_APPROXIMATE';
  sessionId?: string;
}

export interface LocationStoreState {
  status: LocationStatus;
  data: LocationData | null;
  error: string | null;
  lastUpdated: number | null;
}

const STORAGE_KEY = 'panchayat_ai_location_session';
const STALE_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

class LocationStore {
  private state: LocationStoreState = {
    status: 'IDLE',
    data: null,
    error: null,
    lastUpdated: null,
  };

  private listeners: Set<(state: LocationStoreState) => void> = new Set();

  constructor() {
    this.loadPersistedState();
    this.startStaleTimer();
  }

  private loadPersistedState() {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { data: LocationData; lastUpdated: number };
        const isStale = Date.now() - parsed.lastUpdated > STALE_THRESHOLD_MS;
        this.state = {
          status: isStale ? 'STALE' : 'READY',
          data: parsed.data,
          error: null,
          lastUpdated: parsed.lastUpdated,
        };
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  private persistState() {
    try {
      if (this.state.data && (this.state.status === 'READY' || this.state.status === 'STALE')) {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            data: this.state.data,
            lastUpdated: this.state.lastUpdated ?? Date.now(),
          })
        );
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage write errors
    }
  }

  private startStaleTimer() {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.checkStale();
      }, 60000); // Check every minute
    }
  }

  public getState(): LocationStoreState {
    return { ...this.state };
  }

  public subscribe(listener: (state: LocationStoreState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.persistState();
    const currentState = this.getState();
    this.listeners.forEach((listener) => listener(currentState));
  }

  public checkStale() {
    if (this.state.status === 'READY' && this.state.lastUpdated) {
      if (Date.now() - this.state.lastUpdated > STALE_THRESHOLD_MS) {
        this.state.status = 'STALE';
        this.notify();
      }
    }
  }

  /**
   * Request location explicitly using HTML5 browser geolocation.
   */
  public async requestBrowserLocation(_explicit: boolean = true): Promise<void> {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      this.state = {
        status: 'UNAVAILABLE',
        data: null,
        error: 'HTML5 Geolocation is not supported by your browser.',
        lastUpdated: null,
      };
      this.notify();
      return;
    }

    this.state = {
      ...this.state,
      status: 'REQUESTING',
      error: null,
    };
    this.notify();

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy;
          const timestamp = new Date(position.timestamp || Date.now()).toISOString();

          this.state.status = 'GRANTED';
          this.notify();

          try {
            // Register session with backend
            const sessionRes: LocationSessionResponse = await locationApi.createSession({
              latitude: lat,
              longitude: lng,
              accuracy_meters: accuracy,
              timestamp,
              source: 'GPS_BROWSER',
              persist_precise: false,
            });

            this.state = {
              status: 'READY',
              data: {
                latitude: lat,
                longitude: lng,
                accuracy,
                timestamp,
                formattedAddress: sessionRes.approx_address,
                locality: sessionRes.locality,
                city: sessionRes.city,
                state: sessionRes.state,
                source: 'GPS_BROWSER',
                sessionId: sessionRes.location_session_id,
              },
              error: null,
              lastUpdated: Date.now(),
            };
          } catch (err) {
            // Fallback to client-side reverse geocoding structure if backend API fails
            this.state = {
              status: 'READY',
              data: {
                latitude: lat,
                longitude: lng,
                accuracy,
                timestamp,
                formattedAddress: `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
                locality: 'Local Area',
                city: 'Local Market',
                source: 'GPS_BROWSER',
              },
              error: `Session registered offline: ${err instanceof Error ? err.message : 'API error'}`,
              lastUpdated: Date.now(),
            };
          }
          this.notify();
          resolve();
        },
        (error) => {
          let errorMessage = 'Unable to retrieve location.';
          let nextStatus: LocationStatus = 'UNAVAILABLE';

          if (error.code === error.PERMISSION_DENIED) {
            nextStatus = 'DENIED';
            errorMessage = 'Location permission was denied. You can select your market location manually.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            nextStatus = 'UNAVAILABLE';
            errorMessage = 'Device location signal is currently unavailable.';
          } else if (error.code === error.TIMEOUT) {
            nextStatus = 'UNAVAILABLE';
            errorMessage = 'Location request timed out. Please try again or select manually.';
          }

          this.state = {
            status: nextStatus,
            data: null,
            error: errorMessage,
            lastUpdated: null,
          };
          this.notify();
          resolve();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }

  /**
   * Set location manually (e.g. when permission is denied or manual city search used).
   */
  public async setManualLocation(
    address: string,
    latitude: number,
    longitude: number,
    locality?: string,
    city?: string
  ): Promise<void> {
    this.state.status = 'REQUESTING';
    this.notify();

    const timestamp = new Date().toISOString();

    try {
      const sessionRes = await locationApi.createSession({
        latitude,
        longitude,
        accuracy_meters: 0.0,
        timestamp,
        source: 'MANUAL_USER_INPUT',
        persist_precise: true,
      });

      this.state = {
        status: 'READY',
        data: {
          latitude,
          longitude,
          accuracy: 0,
          timestamp,
          formattedAddress: address || sessionRes.approx_address,
          locality: locality || sessionRes.locality,
          city: city || sessionRes.city,
          state: sessionRes.state,
          source: 'MANUAL_USER_INPUT',
          sessionId: sessionRes.location_session_id,
        },
        error: null,
        lastUpdated: Date.now(),
      };
    } catch {
      this.state = {
        status: 'READY',
        data: {
          latitude,
          longitude,
          accuracy: 0,
          timestamp,
          formattedAddress: address,
          locality: locality || 'Selected Market',
          city: city || 'Local Market',
          source: 'MANUAL_USER_INPUT',
        },
        error: null,
        lastUpdated: Date.now(),
      };
    }
    this.notify();
  }

  /**
   * Refresh current location if STALE or on user demand.
   */
  public async refreshLocation(): Promise<void> {
    if (this.state.data?.source === 'GPS_BROWSER') {
      return this.requestBrowserLocation(true);
    } else if (this.state.data) {
      return this.setManualLocation(
        this.state.data.formattedAddress,
        this.state.data.latitude,
        this.state.data.longitude,
        this.state.data.locality,
        this.state.data.city
      );
    }
    return this.requestBrowserLocation(true);
  }

  /**
   * Reset location state back to IDLE.
   */
  public clearLocation(): void {
    this.state = {
      status: 'IDLE',
      data: null,
      error: null,
      lastUpdated: null,
    };
    sessionStorage.removeItem(STORAGE_KEY);
    this.notify();
  }
}

export const locationStore = new LocationStore();
