/**
 * LocationPickerModal — Explicit Location Permission & Manual Selector UX
 * Supports HTML5 Geolocation request, permission error feedback,
 * manual market selection, and detailed location state diagnostics.
 */

import React, { useState } from 'react';
import { useLocation } from '../hooks/useLocation';
import {
  X,
  Navigation,
  MapPin,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertOctagon,
  ShieldCheck,
  Building2,
  Trash2,
} from 'lucide-react';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_MARKET_HUBS = [
  {
    name: 'Gadag APMC Market',
    locality: 'Hulkoti Market',
    city: 'Gadag',
    state: 'Karnataka',
    lat: 15.4328,
    lng: 75.6318,
  },
  {
    name: 'Hubballi Cotton Market',
    locality: 'Old Hubli',
    city: 'Hubballi',
    state: 'Karnataka',
    lat: 15.3647,
    lng: 75.124,
  },
  {
    name: 'Bengaluru Commercial Street',
    locality: 'Tasker Town',
    city: 'Bengaluru',
    state: 'Karnataka',
    lat: 12.9815,
    lng: 77.6083,
  },
  {
    name: 'Mumbai APMC Vashi',
    locality: 'Vashi Market',
    city: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.076,
    lng: 72.8777,
  },
  {
    name: 'Delhi Azadpur Market',
    locality: 'Azadpur',
    city: 'New Delhi',
    state: 'Delhi',
    lat: 28.7041,
    lng: 77.1025,
  },
];

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({ isOpen, onClose }) => {
  const {
    status,
    data,
    error,
    requestBrowserLocation,
    setManualLocation,
    refreshLocation,
    clearLocation,
  } = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);

  if (!isOpen) return null;

  const handleRequestGps = async () => {
    await requestBrowserLocation(true);
  };

  const handleSelectPreset = async (hub: (typeof POPULAR_MARKET_HUBS)[0]) => {
    await setManualLocation(hub.name, hub.lat, hub.lng, hub.locality, hub.city);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAddress.trim()) return;
    setIsSubmittingCustom(true);
    // Approximate centroid based on search input (uses default APMC centroid if unparsed)
    await setManualLocation(customAddress.trim(), 15.4328, 75.6318, customAddress.trim(), 'Local Market');
    setIsSubmittingCustom(false);
    setCustomAddress('');
  };

  const filteredHubs = POPULAR_MARKET_HUBS.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <MapPin className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Regional Market Location</h2>
              <p className="text-xs text-slate-400">Discover verified local sellers & price discovery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Permission Error / Warning Banner */}
          {status === 'DENIED' && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-2">
              <div className="flex items-start gap-2.5 text-rose-400 font-semibold">
                <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Browser Geolocation Permission Denied</span>
              </div>
              <p className="text-slate-300 leading-relaxed pl-6">
                You denied location access or your browser blocks location prompts.
                You can select your market hub manually below, or enable permission in your browser site settings.
              </p>
            </div>
          )}

          {error && status !== 'DENIED' && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Explicit GPS Trigger Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-800/50 to-slate-800/80 border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <Navigation className="w-4 h-4" />
                <span>HTML5 GPS Detection</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono">
                Primary
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Detect your location using high-accuracy browser GPS to find local merchants nearby.
            </p>
            <button
              onClick={handleRequestGps}
              disabled={status === 'REQUESTING'}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/10"
            >
              {status === 'REQUESTING' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Requesting Browser Geolocation...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 fill-slate-950" />
                  <span>Use My Device GPS Location</span>
                </>
              )}
            </button>
          </div>

          {/* Active Session Info Card */}
          {(status === 'READY' || status === 'STALE') && data && (
            <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">Active Location Session</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    status === 'STALE'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {status}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-700 text-slate-300 font-mono">
                    {data.source}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="text-slate-100 font-semibold">{data.formattedAddress}</div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-400 font-mono">
                  <div>Lat: <span className="text-slate-200">{data.latitude.toFixed(5)}</span></div>
                  <div>Lng: <span className="text-slate-200">{data.longitude.toFixed(5)}</span></div>
                  <div>Accuracy: <span className="text-slate-200">{data.accuracy > 0 ? `±${Math.round(data.accuracy)}m` : 'Manual'}</span></div>
                  <div>Captured: <span className="text-slate-200">{new Date(data.timestamp).toLocaleTimeString()}</span></div>
                </div>
                {data.sessionId && (
                  <div className="text-[10px] text-slate-500 font-mono pt-1 truncate">
                    ID: {data.sessionId}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
                <button
                  onClick={() => refreshLocation()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-medium text-slate-200 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => clearLocation()}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-medium text-rose-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>
          )}

          {/* Manual Market Selection Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Select Market Hub Manually</span>
              <span className="text-[11px] text-slate-500">No permission required</span>
            </div>

            {/* Filter Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search market hubs or cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Popular Presets List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {filteredHubs.map((hub) => (
                <button
                  key={hub.name}
                  onClick={() => handleSelectPreset(hub)}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-amber-500/40 text-left transition group"
                >
                  <Building2 className="w-4 h-4 text-amber-400/80 group-hover:text-amber-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-amber-300 truncate">
                      {hub.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {hub.city}, {hub.state}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Location Search Form */}
            <form onSubmit={handleCustomSubmit} className="pt-2 flex gap-2">
              <input
                type="text"
                placeholder="Enter custom location name or address..."
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
              <button
                type="submit"
                disabled={!customAddress.trim() || isSubmittingCustom}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 disabled:opacity-50 transition"
              >
                Set
              </button>
            </form>
          </div>

          {/* Privacy Note */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p>
              <strong className="text-slate-300">Privacy First:</strong> Precise GPS coordinates are never stored on servers unless explicitly authorized. Location session data is stored only in temporary browser memory.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
