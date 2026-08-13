import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Store, 
  MapPin, 
  TrendingDown, 
  Send,
  MessageSquare,
  Flame,
  CheckCircle2,
  Clock,
  Radio,
  Sliders,
  ShieldCheck,
  Award
} from 'lucide-react';
import type { NegotiationSession, StrictOffer } from '../types';
import { FactBusVisualizer } from './FactBusVisualizer';

interface LiveNegotiationProps {
  session: NegotiationSession;
  onIntervene?: (sellerId: string, prompt: string) => void;
  onCompleteSession?: () => void;
  onNegotiationComplete?: () => void;
}

export const LiveNegotiation: React.FC<LiveNegotiationProps> = ({
  session,
  onIntervene,
  onCompleteSession,
  onNegotiationComplete
}) => {
  const [customIntervention, setCustomIntervention] = useState('');
  const [targetSellerId, setTargetSellerId] = useState<string | null>(null);

  const offersArray = Object.values(session.offers);

  const handleSendIntervention = (sellerId: string) => {
    if (customIntervention.trim() && onIntervene) {
      onIntervene(sellerId, customIntervention);
      setCustomIntervention('');
      setTargetSellerId(null);
    }
  };

  const handleFinish = () => {
    if (onCompleteSession) onCompleteSession();
    if (onNegotiationComplete) onNegotiationComplete();
  };

  // Status Badge Mapper
  const getStatusBadge = (statusStr: string) => {
    const upper = (statusStr || 'NEGOTIATING').toUpperCase();
    if (upper.includes('VERIF') || upper === 'COMPLETED') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">✓ VERIFIED</span>;
    } else if (upper.includes('COUNTER')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">⚡ COUNTERING</span>;
    } else if (upper.includes('INITIAL') || upper.includes('OFFER_REC')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/40">OFFER_RECEIVED</span>;
    } else if (upper === 'CONTACTED' || upper === 'CONTACTING') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">CONTACTING</span>;
    } else if (upper === 'DISCOVERED' || upper === 'DISCOVERING') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-800 text-slate-300 border border-slate-700">DISCOVERING</span>;
    } else {
      return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-500/20 text-purple-400 border border-purple-500/40">NEGOTIATING</span>;
    }
  };

  return (
    <div className="space-y-6 py-4 animate-fadeIn text-slate-100">
      
      {/* Top Command Center Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-md">
                ⚡ Command Center · Round {session.currentRound} / 4
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                Session: {session.sessionId}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-2">
              Live Negotiation: "{session.requirement.product}"
            </h2>
            <p className="text-xs text-slate-400">
              Budget: <span className="font-bold text-slate-200">₹{session.requirement.budget.toLocaleString('en-IN')}</span> · Location: {session.requirement.location}
            </p>
          </div>

          {/* Fact Bus Best Offer Highlight Widget */}
          <div className="bg-slate-950 px-5 py-3.5 rounded-2xl border border-slate-800 flex items-center gap-5 shadow-inner">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Fact Bus Best Offer
              </span>
              <div className="text-2xl font-black text-emerald-400 font-mono flex items-center gap-1">
                {session.bestOffer ? (
                  <>
                    ₹{session.bestOffer.toLocaleString('en-IN')}
                    <TrendingDown className="w-5 h-5 text-emerald-400 animate-bounce" />
                  </>
                ) : (
                  <span className="text-slate-500 text-sm">Extracting quotes...</span>
                )}
              </div>
            </div>

            {session.bestSellerName && (
              <div className="text-right border-l border-slate-800 pl-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Leading Merchant</span>
                <span className="text-xs font-extrabold text-amber-400 truncate max-w-[140px] block">
                  {session.bestSellerName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Savings Tracker Metric */}
        {session.totalSavings > 0 && (
          <div className="mt-4 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-transparent p-3.5 rounded-2xl border border-emerald-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Flame className="w-4.5 h-4.5 text-orange-400 animate-pulse" />
              Fact Bus Savings Generated: ₹{session.totalSavings.toLocaleString('en-IN')} ({session.savingsPercentage}% off initial quotes)
            </div>
            <button
              onClick={handleFinish}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              View Deal Intelligence Ranking →
            </button>
          </div>
        )}
      </div>

      {/* 3-Column Command-Center Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (3 Cols): Negotiation Overview */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Sliders className="w-4 h-4" /> Session Overview
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">State Machine Phase</span>
                <span className="font-extrabold text-white text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">
                  {session.status || 'NEGOTIATING'}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Active Sellers</span>
                <span className="font-extrabold text-slate-200 text-sm">{offersArray.length} Merchants Contacted</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Max Negotiation Bounds</span>
                <span className="font-extrabold text-emerald-400 font-mono text-xs">Round {session.currentRound} / 4 (Max 4)</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Highest Initial Quote</span>
                <span className="font-extrabold text-slate-300 font-mono text-xs">
                  {session.highestInitialQuote ? `₹${session.highestInitialQuote.toLocaleString('en-IN')}` : '₹64,800'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN (6 Cols): Live Seller Cards */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-400" /> CONTACTED LOCAL SELLERS ({offersArray.length})
            </h3>
            <span className="text-[11px] text-slate-400">Live multi-agent bargaining</span>
          </div>

          <div className="space-y-4">
            {offersArray.map((offer) => {
              const sId = offer.sellerId || offer.seller_id || '';
              const sName = offer.sellerName || offer.seller_name || 'Merchant';
              const initPrice = offer.initialPrice || offer.initial_price || offer.price;
              const priceDrop = initPrice - offer.price;
              const isBest = offer.price === session.bestOffer;
              const statusStr = offer.status || 'ACTIVE';
              const lastMsg = offer.lastMessage || offer.last_message || '';
              const sRating = offer.sellerRating || 4.5;
              const sDistance = offer.sellerDistance || 1.0;
              const roundCount = offer.roundCount || offer.negotiation_round || session.currentRound;
              const confidencePct = Math.round((offer.confidence || 0.94) * 100);

              // Calculate price drop percentage
              const dropPct = initPrice > 0 ? Math.round(((initPrice - offer.price) / initPrice) * 100) : 0;

              return (
                <div
                  key={sId}
                  className={`bg-slate-900/95 rounded-3xl p-5 border transition-all duration-300 relative overflow-hidden shadow-2xl ${
                    isBest
                      ? 'border-emerald-500/60 ring-1 ring-emerald-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isBest && (
                    <span className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase rounded-bl-xl tracking-wider flex items-center gap-1 shadow-md">
                      <Sparkles className="w-3 h-3" /> BEST OFFER LEADER
                    </span>
                  )}

                  {/* Seller Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-base text-white">{sName}</h4>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md">
                          {sRating} ⭐
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" /> {sDistance} km away · {offer.warranty}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black text-white font-mono">
                        ₹{offer.price.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] font-bold text-slate-400">
                        Initial: <span className="line-through text-slate-500">₹{initPrice.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Round Badges Row */}
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(statusStr)}
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        Round {roundCount} / 4
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Confidence:</span>
                      <span className="text-[11px] font-extrabold text-emerald-400 font-mono">{confidencePct}%</span>
                    </div>
                  </div>

                  {/* Price Drop Progress Bar */}
                  <div className="mb-3 space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>Discount Progress</span>
                      <span className="text-emerald-400 font-bold">{dropPct}% Drop (-₹{priceDrop.toLocaleString('en-IN')})</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(10, dropPct * 4))}%` }}
                      />
                    </div>
                  </div>

                  {/* Latest Message Dialogue Box */}
                  <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800 space-y-2 mb-3">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Latest Conversation Log</span>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed italic">
                      "{lastMsg}"
                    </p>
                  </div>

                  {/* Intervention Trigger */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="italic truncate max-w-[240px]">
                      Log: {offer.evidence || 'Verified Quote'}
                    </span>
                    <button
                      onClick={() => setTargetSellerId(targetSellerId === sId ? null : sId)}
                      className="font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" /> Intervene & Ask Perk
                    </button>
                  </div>

                  {/* Custom Intervention Input Drawer */}
                  {targetSellerId === sId && (
                    <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2 animate-fadeIn">
                      <input
                        type="text"
                        value={customIntervention}
                        onChange={(e) => setCustomIntervention(e.target.value)}
                        placeholder='e.g. "Can you include a free laptop bag and mouse?"'
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                      <button
                        onClick={() => handleSendIntervention(sId)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3" /> Send
                      </button>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN (3 Cols): Fact Bus / Market Intelligence Panel */}
        <div className="lg:col-span-3">
          <FactBusVisualizer session={session} />
        </div>

      </div>

    </div>
  );
};
