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

import { NotificationCenter } from './NotificationCenter';

interface NavbarProps {
  activeTab: 'customer' | 'negotiation' | 'results' | 'seller' | 'admin' | 'command_center';
  setActiveTab: (tab: 'customer' | 'negotiation' | 'results' | 'seller' | 'admin' | 'command_center') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  isNegotiating: boolean;
  bestOffer: number | null;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  isNegotiating,
  bestOffer,
  onOpenAuth
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

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Branding */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('customer')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-emerald-500 p-0.5 shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-400 fill-amber-400/20" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-amber-400 via-orange-300 to-emerald-400 bg-clip-text text-transparent">
                  PANCHAYAT AI
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" /> FACT BUS ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Local Market Negotiation Agent
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('customer')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'customer'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Buyer Discovery
            </button>

            <button
              onClick={() => setActiveTab('negotiation')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                activeTab === 'negotiation'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Live Negotiation
              {isNegotiating && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute -top-1 -right-1" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('results')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'results'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Deals & Results
            </button>

            <button
              onClick={() => setActiveTab('seller')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'seller'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              Seller Portal
            </button>

            <button
              onClick={() => setActiveTab('command_center')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'command_center'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Command Center
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              Analytics
            </button>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <NotificationCenter />

            {bestOffer !== null && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                <span className="text-[10px] text-emerald-500 uppercase tracking-wider font-bold">Best Offer:</span>
                <span className="font-bold text-white">₹{bestOffer.toLocaleString('en-IN')}</span>
              </div>
            )}

            {/* User Auth Badge / Login Button */}
            {user ? (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <div className="hidden sm:block">
                  <span className="font-bold text-white block leading-tight">{user.name}</span>
                  <span className="text-[9px] font-mono text-amber-400 font-semibold uppercase">{user.role}</span>
                </div>
                <button
                  onClick={() => authStore.clearSession()}
                  title="Sign Out"
                  className="ml-1 p-1 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition-all"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                Sign In
              </button>
            )}

            {/* Language Selector */}
            <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl px-2 py-1">
              <Globe className="w-4 h-4 text-amber-400 mr-1.5" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="en" className="bg-slate-900 text-slate-200">English 🇬🇧</option>
                <option value="hi" className="bg-slate-900 text-slate-200">हिन्दी (Hindi) 🇮🇳</option>
                <option value="kn" className="bg-slate-900 text-slate-200">ಕನ್ನಡ (Kannada) 🇮🇳</option>
                <option value="ur" className="bg-slate-900 text-slate-200">اردو (Urdu) 🇮🇳</option>
              </select>
            </div>
          </div>

        </div>

        {/* Mobile Navigation Links */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/60 text-[11px] font-semibold text-slate-400">
          <button onClick={() => setActiveTab('customer')} className={activeTab === 'customer' ? 'text-amber-400' : ''}>
            Buyer
          </button>
          <button onClick={() => setActiveTab('negotiation')} className={activeTab === 'negotiation' ? 'text-amber-400' : ''}>
            Live
          </button>
          <button onClick={() => setActiveTab('results')} className={activeTab === 'results' ? 'text-amber-400' : ''}>
            Deals
          </button>
          <button onClick={() => setActiveTab('seller')} className={activeTab === 'seller' ? 'text-emerald-400' : ''}>
            Seller
          </button>
          <button onClick={() => setActiveTab('command_center')} className={activeTab === 'command_center' ? 'text-indigo-400' : ''}>
            Command
          </button>
          <button onClick={() => setActiveTab('admin')} className={activeTab === 'admin' ? 'text-blue-400' : ''}>
            Admin
          </button>
        </div>

      </div>
    </header>
  );
};
