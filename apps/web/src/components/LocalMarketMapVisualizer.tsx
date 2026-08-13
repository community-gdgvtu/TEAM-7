import React, { useState } from 'react';
import { MapPin, Store, Navigation, Star } from 'lucide-react';
import type { NegotiationSession, Seller } from '../types';

interface LocalMarketMapVisualizerProps {
  session: NegotiationSession;
  onSelectSeller?: (sellerId: string) => void;
}

export const LocalMarketMapVisualizer: React.FC<LocalMarketMapVisualizerProps> = ({
  session,
  onSelectSeller
}) => {
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(
    session.activeSellers[0] || null
  );

  const handleSellerClick = (seller: Seller) => {
    setSelectedSeller(seller);
    if (onSelectSeller) onSelectSeller(seller.id);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100 animate-fadeIn">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Local Market Geospatial Intelligence
            </h3>
            <p className="text-[11px] text-slate-400">
              Approximate market radius mapping · {session.activeSellers.length} Local Sellers Contacted
            </p>
          </div>
        </div>

        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          Privacy Protected
        </span>
      </div>

      {/* Map Canvas / Grid Representation */}
      <div className="relative w-full h-72 bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden p-4 flex flex-col justify-between shadow-inner">
        {/* Background Grid Lines simulation */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

        {/* Top Overlay Legend */}
        <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-400 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" /> Customer (Approx Centroid)
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Active Merchant Pins
          </span>
        </div>

        {/* Pins Interactive Layout */}
        <div className="relative z-10 flex-1 flex items-center justify-around my-4">
          
          {/* Customer Pin (Center) */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 animate-pulse">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-amber-400 mt-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              Customer Radius
            </span>
          </div>

          {/* Seller Pins Grid */}
          <div className="flex items-center gap-4 sm:gap-8 overflow-x-auto py-2">
            {session.activeSellers.slice(0, 4).map((seller) => {
              const isSelected = selectedSeller?.id === seller.id;
              const offer = session.offers[seller.id];

              return (
                <button
                  key={seller.id}
                  onClick={() => handleSellerClick(seller)}
                  className={`flex flex-col items-center transition-all cursor-pointer p-2 rounded-2xl ${
                    isSelected ? 'bg-emerald-500/10 border border-emerald-500/40 scale-105' : 'hover:bg-slate-900/60'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shadow-md ${
                    isSelected 
                      ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/30' 
                      : 'bg-slate-900 border border-slate-700 text-slate-200'
                  }`}>
                    <Store className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-extrabold text-white mt-1 truncate max-w-[90px]">
                    {seller.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400 font-bold">
                    {offer ? `₹${offer.price.toLocaleString('en-IN')}` : `${seller.distanceKm} km`}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Selected Seller Inspector Card Drawer */}
        {selectedSeller && (
          <div className="relative z-10 bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-md flex items-center justify-between text-xs animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-white">{selectedSeller.name}</h4>
                  <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400" /> {selectedSeller.rating}★
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {selectedSeller.distanceKm} km away · {selectedSeller.category} · Stock: <span className="text-emerald-400 font-bold">{selectedSeller.stockStatus}</span>
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Negotiated Quote</span>
              <span className="text-sm font-black text-emerald-400 font-mono">
                ₹{session.offers[selectedSeller.id]?.price.toLocaleString('en-IN') || '58,000'}
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
