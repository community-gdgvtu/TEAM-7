/**
 * useLocation — Custom React Hook for Real User Geolocation
 * Subscribes to locationStore to provide active location status, coordinates, and controls.
 */

import { useEffect, useState } from 'react';
import { locationStore } from '../stores/locationStore';
import type { LocationStoreState } from '../stores/locationStore';

export function useLocation() {
  const [state, setState] = useState<LocationStoreState>(() => locationStore.getState());

  useEffect(() => {
    const unsubscribe = locationStore.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  return {
    status: state.status,
    data: state.data,
    error: state.error,
    lastUpdated: state.lastUpdated,
    requestBrowserLocation: (explicit: boolean = true) => locationStore.requestBrowserLocation(explicit),
    setManualLocation: (address: string, lat: number, lng: number, locality?: string, city?: string) =>
      locationStore.setManualLocation(address, lat, lng, locality, city),
    refreshLocation: () => locationStore.refreshLocation(),
    clearLocation: () => locationStore.clearLocation(),
    checkStale: () => locationStore.checkStale(),
  };
}
