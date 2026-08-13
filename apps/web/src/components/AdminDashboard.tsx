import React from 'react';
import { 
  LineChart, 
  ShoppingBag, 
  Radio, 
  Layers
} from 'lucide-react';
import type { NegotiationSession } from '../types';

interface AdminDashboardProps {
  session: NegotiationSession;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ session }) => {
  return (
    <div className="space-y-8 py-6 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xl">
            <LineChart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">MARKET INTELLIGENCE DASHBOARD</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Panchayat AI system analytics & real-time offline market insights
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
          <Radio className="w-3 h-3 animate-pulse" /> SESSION: {session.sessionId}
        </span>
      </div>

      {/* Top 5 Metrics Cards (Requirement #19) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Active Negotiations</span>
          <div className="text-3xl font-black text-white">24</div>
          <span className="text-[10px] text-emerald-400 font-bold mt-1 block">Live right now</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Offers Collected</span>
          <div className="text-3xl font-black text-amber-400">83</div>
          <span className="text-[10px] text-slate-400 mt-1 block">+12 in last hour</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Average Savings</span>
          <div className="text-3xl font-black text-emerald-400">8.7%</div>
          <span className="text-[10px] text-emerald-400 font-bold mt-1 block">~₹6,100 per deal</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Successful Deals</span>
          <div className="text-3xl font-black text-teal-400">18</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Accepted today</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Local Sellers</span>
          <div className="text-3xl font-black text-purple-400">47</div>
          <span className="text-[10px] text-purple-400 font-bold mt-1 block">Verified merchants</span>
        </div>
      </div>

      {/* Popular Products Heat Graph & Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        <div className="md:col-span-7 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-400" /> POPULAR DEMAND CATEGORIES
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-bold text-slate-200 mb-1">
                <span>Smartphones & Mobiles</span>
                <span className="text-amber-400">38% Demand</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full w-[38%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-200 mb-1">
                <span>Laptops & Computers</span>
                <span className="text-emerald-400">29% Demand</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full w-[29%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-200 mb-1">
                <span>Groceries & Rice</span>
                <span className="text-teal-400">18% Demand</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-gradient-to-r from-teal-500 to-cyan-500 h-full rounded-full w-[18%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-200 mb-1">
                <span>Hardware & Power Tools</span>
                <span className="text-purple-400">15% Demand</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full w-[15%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Fact Bus System Audit Feed */}
        <div className="md:col-span-5 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-blue-400" /> SYSTEM FACT BUS AUDIT LOG
            </h3>
            
            <div className="space-y-2 font-mono text-[11px] max-h-[220px] overflow-y-auto pr-1">
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300">
                <span className="text-emerald-400 font-bold">[14:32:01]</span> BEST_OFFER_UPDATED ₹58,900
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300">
                <span className="text-amber-400 font-bold">[14:31:40]</span> COUNTER_OFFER Seller C ₹58,900
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300">
                <span className="text-blue-400 font-bold">[14:31:25]</span> BENCHMARK_LEVERAGED ₹59,500
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Fact Bus Version: <strong>v2.4-Hackathon</strong></span>
            <span className="text-emerald-400 font-bold">100% Operational</span>
          </div>
        </div>

      </div>

    </div>
  );
};
