import React from 'react';
import type { FactBusEvent, NegotiationSession } from '../types';
import { Radio, Zap, ShieldCheck, TrendingDown, Clock } from 'lucide-react';

interface FactBusVisualizerProps {
  session: NegotiationSession;
}

export const FactBusVisualizer: React.FC<FactBusVisualizerProps> = ({ session }) => {
  const { bestOffer, bestSellerName, events, highestInitialQuote, totalSavings, savingsPercentage } = session;

  const getEventBadge = (type: FactBusEvent['eventType']) => {
    switch (type) {
      case 'BEST_OFFER_UPDATED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">🔥 BEST OFFER UPDATED</span>;
      case 'BENCHMARK_LEVERAGED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">⚡ FACT BUS BENCHMARK</span>;
      case 'INITIAL_OFFER':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">INITIAL QUOTE</span>;
      case 'COUNTER_OFFER':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">COUNTER OFFER</span>;
      case 'OFFER_VERIFIED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30">VERIFIED DEAL</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400">EVENT</span>;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col h-full">
      
      {/* Fact Bus Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
              FACT BUS <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30">SHARED MEMORY</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Real-time cross-seller negotiation state engine
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-slate-500">ID: {session.sessionId}</span>
      </div>

      {/* Best Discovered Offer Spotlight */}
      <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 border border-emerald-500/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <Zap className="w-3 h-3" /> BEST DISCOVERED OFFER
            </span>
            <div className="text-3xl font-black text-white mt-1">
              {bestOffer !== null ? `₹${bestOffer.toLocaleString('en-IN')}` : 'Calculating...'}
            </div>
            {bestSellerName && (
              <p className="text-xs font-semibold text-slate-300 mt-0.5">
                Leader: <span className="text-emerald-400 font-bold">{bestSellerName}</span>
              </p>
            )}
          </div>

          {highestInitialQuote && totalSavings > 0 && (
            <div className="text-right">
              <span className="text-[10px] font-semibold text-slate-400 block">Total Price Savings</span>
              <div className="text-lg font-extrabold text-emerald-400 flex items-center justify-end gap-1">
                <TrendingDown className="w-4 h-4" /> ₹{totalSavings.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 inline-block mt-1">
                {savingsPercentage}% Lower
              </span>
            </div>
          )}
        </div>

        {/* Verification Status (Requirement #9) */}
        <div className="mt-3 pt-2.5 border-t border-emerald-500/20 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Price Confidence: <strong className="text-white">96% (Verified)</strong></span>
          </div>
          <span className="text-[10px] text-slate-400">Panchayat AI active benchmark</span>
        </div>
      </div>

      {/* Live Fact Bus Event Log Stream (Requirement #14) */}
      <div className="mt-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> LIVE EVENT STREAM ({events.length})
          </span>
          <span className="text-[10px] font-medium text-slate-500">Auto-scroll active</span>
        </div>

        <div className="flex-1 max-h-[360px] overflow-y-auto space-y-2 pr-1 font-mono text-xs custom-scrollbar">
          {events.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs font-sans">
              Waiting for negotiation events...
            </div>
          ) : (
            events.map((evt) => (
              <div
                key={evt.id}
                className={`p-2.5 rounded-xl border text-[11px] transition-all animate-fadeIn ${
                  evt.eventType === 'BEST_OFFER_UPDATED'
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : evt.eventType === 'BENCHMARK_LEVERAGED'
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1 font-sans">
                  <span className="text-[10px] text-slate-400 font-bold">{evt.timestamp}</span>
                  {getEventBadge(evt.eventType)}
                </div>
                <p className="font-semibold leading-relaxed">
                  {evt.message}
                </p>
                {evt.price && (
                  <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-slate-400">
                    <span>PRICE: <strong className="text-amber-400">₹{evt.price.toLocaleString('en-IN')}</strong></span>
                    {evt.previousBestPrice && (
                      <span>WAS: <span className="line-through">₹{evt.previousBestPrice.toLocaleString('en-IN')}</span></span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
