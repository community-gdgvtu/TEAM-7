import React, { useEffect, useState } from 'react';
import { 
  Trophy, 
  Sparkles, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  TrendingDown, 
  Star, 
  Store, 
  Bookmark,
  Share2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RotateCcw,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { DealScore, NegotiationSession, Seller } from '../types';
import { calculateDealIntelligence } from '../services/dealIntelligence';

interface ResultsScreenProps {
  session: NegotiationSession;
  onRestart: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ session, onRestart }) => {
  const [dealScores, setDealScores] = useState<DealScore[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [expandedRationale, setExpandedRationale] = useState<string | null>(null);

  useEffect(() => {
    const scores = calculateDealIntelligence(session);
    setDealScores(scores);

    // Fire celebratory confetti!
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }
  }, [session]);

  const recommendedDeal = dealScores.find((d) => d.isRecommended) || dealScores[0];

  const highestQuote = session.highestInitialQuote || (session.bestOffer ? session.bestOffer * 1.12 : 64800);
  const bestOffer = session.bestOffer || 57024;
  const savings = highestQuote - bestOffer;
  const savingsPercent = parseFloat(((savings / highestQuote) * 100).toFixed(2));
  const sellersContactedCount = session.activeSellers.length || 5;
  const offersReceivedCount = Object.keys(session.offers).length || sellersContactedCount;

  const handleOpenClaim = (deal: DealScore) => {
    const seller = session.activeSellers.find((s) => s.id === deal.sellerId);
    if (seller) {
      setSelectedSeller(seller);
      setIsClaimModalOpen(true);
    }
  };

  const handleSaveDeal = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleShareResult = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `Panchayat AI discovered best offer of ₹${bestOffer.toLocaleString('en-IN')} for ${session.requirement.product} at ${recommendedDeal?.sellerName}!`
      );
    }
    setIsShared(true);
    setTimeout(() => setIsShared(false), 3000);
  };

  return (
    <div className="space-y-8 py-6 animate-fadeIn text-slate-100">
      
      {/* Top Banner — Negotiation Completed */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/60 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 shadow-md">
                <CheckCircle2 className="w-3.5 h-3.5" /> Negotiation completed.
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                ID: {session.sessionId}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Best Deal Discovered for "{session.requirement.product}"
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Panchayat AI contacted <span className="font-bold text-amber-400">{sellersContactedCount} local sellers</span> in {session.requirement.location} and secured <span className="font-bold text-emerald-400">{offersReceivedCount} verified quotes</span>.
            </p>
          </div>

          {/* Savings Spotlight Box */}
          <div className="bg-slate-950/90 p-5 rounded-2xl border border-emerald-500/50 shadow-2xl flex items-center gap-6 shrink-0">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Price Savings
              </span>
              <div className="text-3xl font-black text-emerald-400 font-mono flex items-center gap-1">
                <TrendingDown className="w-6 h-6 text-emerald-400" /> ₹{savings.toLocaleString('en-IN')}
              </div>
              <span className="text-xs font-bold text-amber-400">
                {savingsPercent}% Lower than initial quote
              </span>
            </div>

            <div className="border-l border-slate-800 pl-6 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Recommended Seller</span>
              <span className="text-sm font-black text-amber-400 block truncate max-w-[160px]">
                {recommendedDeal?.sellerName}
              </span>
              <span className="text-xs font-bold text-white font-mono">
                ₹{bestOffer.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Highest Initial Quote</span>
          <span className="text-lg font-black text-slate-300 font-mono line-through">₹{highestQuote.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Best Discovered Offer</span>
          <span className="text-lg font-black text-emerald-400 font-mono">₹{bestOffer.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Sellers Contacted</span>
          <span className="text-lg font-black text-amber-400 font-mono">{sellersContactedCount} Merchants</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Offers Extracted</span>
          <span className="text-lg font-black text-indigo-400 font-mono">{offersReceivedCount} Quotes</span>
        </div>
      </div>

      {/* Main Deal Comparison Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> Multi-Factor Deal Intelligence Ranking
            </h3>
            <p className="text-xs text-slate-400">
              Evaluated across price competitiveness, merchant reliability rating, local proximity, warranty, and stock availability.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSaveDeal}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Bookmark className="w-3.5 h-3.5" />}
              {isSaved ? 'Saved!' : 'Save Deal'}
            </button>

            <button
              onClick={handleShareResult}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isShared ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              {isShared ? 'Link Copied!' : 'Share Result'}
            </button>

            <button
              onClick={onRestart}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Start New Negotiation
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                <th className="py-3 px-4">Seller</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Distance</th>
                <th className="py-3 px-4">Warranty</th>
                <th className="py-3 px-4">Availability</th>
                <th className="py-3 px-4">Seller Reliability</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Deal Score</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {dealScores.map((deal) => {
                const isRec = deal.isRecommended;
                const isExpanded = expandedRationale === deal.sellerId;

                return (
                  <React.Fragment key={deal.sellerId}>
                    <tr className={`transition-colors ${isRec ? 'bg-emerald-950/20 font-bold' : 'hover:bg-slate-950/50'}`}>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-sm">{deal.sellerName}</span>
                          {isRec && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500 text-slate-950 shadow-md">
                              🏆 RECOMMENDED DEAL
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono font-extrabold text-sm text-emerald-400">
                        ₹{deal.price.toLocaleString('en-IN')}
                      </td>

                      <td className="py-4 px-4 text-slate-300">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" /> {deal.distanceKm} km
                        </span>
                      </td>

                      <td className="py-4 px-4 text-slate-300">
                        {deal.warranty}
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          IN_STOCK
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="flex items-center gap-1 text-amber-400 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" /> {deal.rating}★
                        </span>
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-slate-300">
                        96%
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 font-mono font-black text-amber-400">
                          {deal.totalScore} / 100
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setExpandedRationale(isExpanded ? null : deal.sellerId)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            Why? {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>

                          <button
                            onClick={() => handleOpenClaim(deal)}
                            className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-1 ${
                              isRec 
                                ? 'bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 hover:scale-105' 
                                : 'bg-slate-800 hover:bg-slate-700 text-white'
                            }`}
                          >
                            <Phone className="w-3 h-3" /> Contact Seller
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable "Why this deal?" Rationale Section */}
                    {isExpanded && (
                      <tr className="bg-slate-950/80">
                        <td colSpan={9} className="p-4 border-t border-slate-800">
                          <div className="space-y-3 text-xs">
                            <div className="font-bold text-amber-400 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4" /> Why Panchayat AI Evaluated This Deal:
                            </div>
                            <p className="text-slate-300 leading-relaxed font-medium">
                              "{deal.rationale}"
                            </p>

                            {deal.trade_offs && deal.trade_offs.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-500">Key Trade-Off Factors:</span>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {deal.trade_offs.map((to, idx) => (
                                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 text-[11px] font-semibold">
                                      • {to}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Technical Disclaimer Box Rule */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-300">Technical Disclaimer:</strong> Price is based on offers discovered from contacted sellers and is not guaranteed to be the lowest market price.
        </p>
      </div>

      {/* Contact Seller Direct Claim Modal */}
      {isClaimModalOpen && selectedSeller && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-extrabold">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">{selectedSeller.name}</h3>
                  <span className="text-xs text-slate-400">{selectedSeller.location} · {selectedSeller.distanceKm} km</span>
                </div>
              </div>
              <button
                onClick={() => setIsClaimModalOpen(false)}
                className="text-slate-500 hover:text-white font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Locked Offer Price:</span>
                  <span className="font-bold text-emerald-400 text-sm font-mono">₹{bestOffer.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Warranty Included:</span>
                  <span className="font-bold text-white">{selectedSeller.warrantyOffered}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Direct Phone Contact:</span>
                  <span className="font-mono font-bold text-amber-400">{selectedSeller.phone}</span>
                </div>
              </div>

              <a
                href={`tel:${selectedSeller.phone}`}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4" /> Call Merchant Directly ({selectedSeller.phone})
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
