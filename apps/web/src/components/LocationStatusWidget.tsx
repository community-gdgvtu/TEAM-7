/**
 * LocationStatusWidget — Navbar Location Pill & Quick Trigger
 * Displays active location state (IDLE, REQUESTING, READY, STALE, DENIED, UNAVAILABLE)
 * with human-readable address, accuracy badge, and click action.
 */

import React from 'react';
import { useLocation } from '../hooks/useLocation';
import { MapPin, Navigation, RefreshCw, AlertTriangle, ChevronDown } from 'lucide-react';

interface LocationStatusWidgetProps {
  onOpenPicker: () => void;
}

export const LocationStatusWidget: React.FC<LocationStatusWidgetProps> = ({ onOpenPicker }) => {
  const { status, data, refreshLocation } = useLocation();

  const handleRefreshClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    refreshLocation();
  };

  return (
    <button
      onClick={onOpenPicker}
      className="group relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/80 transition-all duration-200 text-xs font-medium text-slate-300"
      title="Location Settings & Market Centroid"
    >
      {/* State-specific Status Icons & Styling */}
      {status === 'REQUESTING' && (
        <span className="flex items-center gap-1.5 text-amber-400 animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Locating...</span>
        </span>
      )}

      {status === 'IDLE' && (
        <span className="flex items-center gap-1.5 text-slate-400 group-hover:text-slate-200">
          <MapPin className="w-3.5 h-3.5 text-amber-500/80" />
          <span>Set Location</span>
        </span>
      )}

      {(status === 'READY' || status === 'GRANTED') && data && (
        <span className="flex items-center gap-1.5 text-emerald-400">
          <Navigation className="w-3.5 h-3.5 text-emerald-400 fill-emerald-500/20" />
          <span className="max-w-[130px] truncate text-slate-200 font-semibold">
            {data.locality || data.city || 'Local Market'}
          </span>
          {data.accuracy > 0 && (
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ±{Math.round(data.accuracy)}m
            </span>
          )}
        </span>
      )}

      {status === 'STALE' && data && (
        <span className="flex items-center gap-1.5 text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span className="max-w-[110px] truncate text-slate-300">
            {data.locality || data.city || 'Location'}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Stale
          </span>
          <span
            onClick={handleRefreshClick}
            className="p-1 hover:bg-slate-700 rounded-full transition"
            title="Refresh location"
          >
            <RefreshCw className="w-3 h-3 text-amber-400" />
          </span>
        </span>
      )}

      {status === 'DENIED' && (
        <span className="flex items-center gap-1.5 text-rose-400">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span>Location Denied</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">Manual</span>
        </span>
      )}

      {status === 'UNAVAILABLE' && (
        <span className="flex items-center gap-1.5 text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          <span>Location Off</span>
        </span>
      )}

      <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-transform group-hover:translate-y-0.5" />
    </button>
  );
};
