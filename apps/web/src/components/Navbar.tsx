import React, { useEffect, useState } from 'react';
import { 
  Cpu, 
  Globe, 
  LineChart, 
  Store, 
  ShoppingBag, 
  Zap, 
  Radio,
  Terminal,
  UserCheck,
  LogOut,
  Lock
} from 'lucide-react';
import type { Language } from '../types';
import { authStore, UserProfile } from '../stores/authStore';
import { canAccessTab, TabId } from '../hooks/usePermission';

import { NotificationCenter } from './NotificationCenter';
import { LocationStatusWidget } from './LocationStatusWidget';

interface NavbarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  isNegotiating: boolean;
  bestOffer: number | null;
  onOpenAuth: () => void;
  onOpenLocationPicker: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  isNegotiating,
  bestOffer,
  onOpenAuth,
  onOpenLocationPicker,
}) => {
  const [user, setUser] = useState<UserProfile | null>(authStore.getUser());

  useEffect(() => {
    const unsub = authStore.subscribe(() => {
      setUser(authStore.getUser());
    });
    return () => {
      unsub();
    };
  }, []);

  const role = user?.role || 'CUSTOMER';

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/95 border-b border-slate-800/80 shadow-2xl w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Left Side Logo & Branding */}
          <div 
            className="flex items-center gap-2 cursor-pointer group shrink-0"
            onClick={() => setActiveTab(role === 'SELLER' ? 'seller' : 'customer')}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-emerald-500 p-0.5 shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-amber-400 via-orange-300 to-emerald-400 bg-clip-text text-transparent whitespace-nowrap">
                PANCHAYAT AI
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1 whitespace-nowrap">
                <Radio className="w-2 h-2 animate-pulse text-emerald-400" /> ACTIVE
              </span>
            </div>
          </div>

          {/* Center Navigation Tabs — Strict Role-Based Filtering */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shrink-0">
            {canAccessTab(role, 'customer') && (
              <button
                onClick={() => setActiveTab('customer')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'customer'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Buyer
              </button>
            )}

            {canAccessTab(role, 'negotiation') && (
              <button
                onClick={() => setActiveTab('negotiation')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all relative cursor-pointer whitespace-nowrap ${
                  activeTab === 'negotiation'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                Live Bargain
                {isNegotiating && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute -top-1 -right-1" />
                )}
              </button>
            )}

            {canAccessTab(role, 'results') && (
              <button
                onClick={() => setActiveTab('results')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'results'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                Deals
              </button>
            )}

            {canAccessTab(role, 'seller') && (
              <button
                onClick={() => setActiveTab('seller')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'seller'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                Seller Portal
              </button>
            )}

            {canAccessTab(role, 'command_center') && (
              <button
                onClick={() => setActiveTab('command_center')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'command_center'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                Command
              </button>
            )}

            {canAccessTab(role, 'admin') && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <LineChart className="w-3.5 h-3.5" />
                Analytics
              </button>
            )}
          </nav>

          {/* Right Side Controls & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Location Pill */}
            <LocationStatusWidget onOpenPicker={onOpenLocationPicker} />

            {/* Notification Bell */}
            <NotificationCenter />

            {/* Best Offer Metric Badge */}
            {bestOffer !== null && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold whitespace-nowrap">
                <span className="text-[10px] text-emerald-500 uppercase tracking-wider">Best:</span>
                <span className="font-extrabold text-white font-mono">₹{bestOffer.toLocaleString('en-IN')}</span>
              </div>
            )}

            {/* User Auth Badge / Sign Out */}
            {user ? (
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs shadow-md shrink-0">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-white block leading-tight truncate max-w-[80px] sm:max-w-[100px]">{user.name}</span>
                  <span className="text-[9px] font-mono text-amber-400 font-bold uppercase">({user.role})</span>
                </div>
                <button
                  onClick={() => authStore.clearSession()}
                  title="Sign Out"
                  className="ml-0.5 p-0.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-md shadow-amber-500/20 whitespace-nowrap"
              >
                <Lock className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}

            {/* Language Selector */}
            <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl px-1.5 py-1 shrink-0">
              <Globe className="w-3.5 h-3.5 text-amber-400 mr-0.5 shrink-0" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer pr-0.5"
              >
                <option value="en" className="bg-slate-900 text-slate-200">EN 🇬🇧</option>
                <option value="hi" className="bg-slate-900 text-slate-200">HI 🇮🇳</option>
                <option value="kn" className="bg-slate-900 text-slate-200">KN 🇮🇳</option>
                <option value="ur" className="bg-slate-900 text-slate-200">UR 🇮🇳</option>
                <option value="ja" className="bg-slate-900 text-slate-200">JA 🇯🇵 (日本語)</option>
              </select>
            </div>
          </div>

        </div>

        {/* Mobile Navigation Links — Role Filtered */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/80 text-[11px] font-bold text-slate-400 overflow-x-auto gap-2">
          {canAccessTab(role, 'customer') && (
            <button onClick={() => setActiveTab('customer')} className={`px-2 py-1 rounded-lg whitespace-nowrap cursor-pointer ${activeTab === 'customer' ? 'bg-amber-500 text-slate-950 font-black' : ''}`}>
              Buyer
            </button>
          )}
          {canAccessTab(role, 'negotiation') && (
            <button onClick={() => setActiveTab('negotiation')} className={`px-2 py-1 rounded-lg whitespace-nowrap cursor-pointer ${activeTab === 'negotiation' ? 'bg-amber-500 text-slate-950 font-black' : ''}`}>
              Live Bargain
            </button>
          )}
          {canAccessTab(role, 'results') && (
            <button onClick={() => setActiveTab('results')} className={`px-2 py-1 rounded-lg whitespace-nowrap cursor-pointer ${activeTab === 'results' ? 'bg-amber-500 text-slate-950 font-black' : ''}`}>
              Deals
            </button>
          )}
          {canAccessTab(role, 'seller') && (
            <button onClick={() => setActiveTab('seller')} className={`px-2 py-1 rounded-lg whitespace-nowrap cursor-pointer ${activeTab === 'seller' ? 'bg-emerald-600 text-white font-black' : ''}`}>
              Seller
            </button>
          )}
          {canAccessTab(role, 'command_center') && (
            <button onClick={() => setActiveTab('command_center')} className={`px-2 py-1 rounded-lg whitespace-nowrap cursor-pointer ${activeTab === 'command_center' ? 'bg-indigo-600 text-white font-black' : ''}`}>
              Command
            </button>
          )}
          {canAccessTab(role, 'admin') && (
            <button onClick={() => setActiveTab('admin')} className={`px-2 py-1 rounded-lg whitespace-nowrap cursor-pointer ${activeTab === 'admin' ? 'bg-blue-600 text-white font-black' : ''}`}>
              Analytics
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
