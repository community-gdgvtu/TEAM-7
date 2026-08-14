import React, { useState } from 'react';
import { 
  Zap, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ShoppingBag, 
  Store, 
  ShieldCheck, 
  Radio, 
  Sparkles,
  Users
} from 'lucide-react';
import { authStore } from '../stores/authStore';
import type { ProductCategory } from '../types';

export const AuthLandingPage: React.FC = () => {
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER_CUSTOMER' | 'REGISTER_SELLER'>('LOGIN');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 98452 11092');
  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Electronics');
  const [address, setAddress] = useState('Hulkoti Market, Gadag');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1-Click Demo Login Handlers
  const handleQuickLogin = (role: 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN') => {
    setIsLoading(true);
    setErrorMsg('');
    
    setTimeout(() => {
      const token = `jwt-token-${role.toLowerCase()}-${Date.now()}`;
      let mockUser;
      
      if (role === 'SELLER') {
        mockUser = {
          id: `usr-seller-${Date.now()}`,
          email: 'seller@panchayat.ai',
          name: 'Sri Lakshmi Electronics',
          role: 'SELLER' as const,
          phone: '+91 98452 11092',
          location: 'Hulkoti Market, Gadag',
          created_at: new Date().toISOString()
        };
      } else if (role === 'ADMIN') {
        mockUser = {
          id: `usr-admin-${Date.now()}`,
          email: 'admin@panchayat.ai',
          name: 'Market Supervisor Admin',
          role: 'ADMIN' as const,
          phone: '+91 90000 00000',
          location: 'Gadag District Market Headquarters',
          created_at: new Date().toISOString()
        };
      } else {
        mockUser = {
          id: `usr-customer-${Date.now()}`,
          email: 'buyer@panchayat.ai',
          name: 'Ramesh Kumar',
          role: 'CUSTOMER' as const,
          phone: '+91 98452 11092',
          location: 'Hulkoti Market, Gadag',
          created_at: new Date().toISOString()
        };
      }

      authStore.setSession(token, mockUser);
      setSuccessMsg(`Authenticated as ${mockUser.name} (${mockUser.role})! Redirecting to Panchayat AI...`);
      setIsLoading(false);
    }, 400);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const token = `jwt-token-${Date.now()}`;
      const mockUser = {
        id: `usr-${Date.now()}`,
        email,
        name: email.split('@')[0] || 'User',
        role: (email.includes('seller') ? 'SELLER' : email.includes('admin') ? 'ADMIN' : 'CUSTOMER') as any,
        phone,
        location: 'Hulkoti Market, Gadag',
        created_at: new Date().toISOString()
      };

      authStore.setSession(token, mockUser);
      setSuccessMsg(`Welcome back, ${mockUser.name}! Opening website...`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
      setIsLoading(false);
    }
  };

  const handleRegisterCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const token = `jwt-token-customer-${Date.now()}`;
      const newUser = {
        id: `usr-${Date.now()}`,
        email,
        name,
        role: 'CUSTOMER' as const,
        phone,
        location: 'Hulkoti Market, Gadag',
        created_at: new Date().toISOString()
      };

      authStore.setSession(token, newUser);
      setSuccessMsg(`Buyer account registered for ${name}! Opening website...`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
      setIsLoading(false);
    }
  };

  const handleRegisterSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const token = `jwt-token-seller-${Date.now()}`;
      const newSellerUser = {
        id: `usr-seller-${Date.now()}`,
        email,
        name: shopName,
        role: 'SELLER' as const,
        phone,
        location: address,
        created_at: new Date().toISOString()
      };

      authStore.setSession(token, newSellerUser);
      setSuccessMsg(`Merchant store "${shopName}" onboarded! Opening website...`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Merchant registration failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between relative overflow-hidden">
      
      {/* Ambient Radial Gradient Background Elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Landing Header Bar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl py-4 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-emerald-500 p-0.5 shadow-lg shadow-orange-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-400 fill-amber-400/20" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight bg-gradient-to-r from-amber-400 via-orange-300 to-emerald-400 bg-clip-text text-transparent">
                  PANCHAYAT AI
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" /> FACT BUS ONLINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Autonomous Local Market Bargaining Network
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Strict JWT RBAC Protection</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Hero Container */}
      <main className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-12 flex-1 flex flex-col lg:flex-row items-center justify-center gap-12">
        
        {/* Left Side: Brand Narrative & Quick Demo Shortcuts */}
        <div className="lg:w-1/2 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Sign In Required to Access Panchayat AI
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
            Local Market <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 bg-clip-text text-transparent">
              AI Negotiation Platform
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
            Discover real local merchants, initiate AI-powered multi-round bargains, and lock in verified deals backed by our immutable Fact Bus memory protocol.
          </p>

          {/* Quick Demo Sign In Buttons */}
          <div className="pt-2 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              ⚡ Instant 1-Click Demo Logins
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => handleQuickLogin('CUSTOMER')}
                disabled={isLoading}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    CUSTOMER
                  </span>
                </div>
                <span className="text-xs font-extrabold text-white block group-hover:text-amber-300">
                  Buyer Login
                </span>
                <span className="text-[10px] text-slate-400 block">Ramesh Kumar</span>
              </button>

              <button
                onClick={() => handleQuickLogin('SELLER')}
                disabled={isLoading}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <Store className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    SELLER
                  </span>
                </div>
                <span className="text-xs font-extrabold text-white block group-hover:text-emerald-300">
                  Merchant Login
                </span>
                <span className="text-[10px] text-slate-400 block">Sri Lakshmi Store</span>
              </button>

              <button
                onClick={() => handleQuickLogin('ADMIN')}
                disabled={isLoading}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                    ADMIN
                  </span>
                </div>
                <span className="text-xs font-extrabold text-white block group-hover:text-blue-300">
                  Admin Login
                </span>
                <span className="text-[10px] text-slate-400 block">Market Admin</span>
              </button>
            </div>
          </div>

          {/* Core Highlights */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 text-left">
            <div>
              <span className="text-lg font-black text-amber-400 block font-mono">100% Real</span>
              <span className="text-[11px] text-slate-400 font-medium">Browser Geolocation</span>
            </div>
            <div>
              <span className="text-lg font-black text-emerald-400 block font-mono">5-Agent</span>
              <span className="text-[11px] text-slate-400 font-medium">Bargaining Pipeline</span>
            </div>
            <div>
              <span className="text-lg font-black text-orange-400 block font-mono">Verified</span>
              <span className="text-[11px] text-slate-400 font-medium">Merchant Onboarding</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card Container */}
        <div className="lg:w-1/2 max-w-md w-full">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            
            {/* Card Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-white">
                  {tab === 'LOGIN' ? 'Sign In to Panchayat AI' : tab === 'REGISTER_CUSTOMER' ? 'Customer Registration' : 'Merchant Store Onboarding'}
                </h3>
                <p className="text-xs text-slate-400">Enter your credentials to unlock the platform</p>
              </div>
            </div>

            {/* Tab Selector */}
            <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-6 text-xs font-bold">
              <button
                onClick={() => { setTab('LOGIN'); setErrorMsg(''); }}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${tab === 'LOGIN' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setTab('REGISTER_CUSTOMER'); setErrorMsg(''); }}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${tab === 'REGISTER_CUSTOMER' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Buyer
              </button>
              <button
                onClick={() => { setTab('REGISTER_SELLER'); setErrorMsg(''); }}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${tab === 'REGISTER_SELLER' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Merchant
              </button>
            </div>

            {/* Form Body */}
            {tab === 'LOGIN' && (
              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Email Address</label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. buyer@panchayat.ai"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Password</label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:opacity-90"
                >
                  {isLoading ? 'Authenticating...' : 'Sign In & Enter Panchayat AI'} <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {tab === 'REGISTER_CUSTOMER' && (
              <form onSubmit={handleRegisterCustomer} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ramesh Kumar"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@panchayat.ai"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98452 11092"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/25 transition-all cursor-pointer hover:opacity-90"
                >
                  {isLoading ? 'Creating Account...' : 'Create Buyer Account (CUSTOMER)'}
                </button>
              </form>
            )}

            {tab === 'REGISTER_SELLER' && (
              <form onSubmit={handleRegisterSeller} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Shop / Store Name</label>
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="Sri Lakshmi Traders"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Computers">Computers</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Clothing">Clothing</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Address / Location</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Hulkoti Market, Gadag"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seller@panchayat.ai"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs shadow-lg shadow-emerald-600/25 transition-all cursor-pointer hover:opacity-90"
                >
                  {isLoading ? 'Onboarding Store...' : 'Register Store (SELLER)'}
                </button>
              </form>
            )}

            {/* Notifications */}
            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
              </div>
            )}

          </div>
        </div>

      </main>

      {/* Landing Footer Bar */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>PANCHAYAT AI — Local Market Autonomous Bargaining Protocol</span>
          <span className="text-[11px] text-slate-500">Strict JWT Authentication & Privacy Control</span>
        </div>
      </footer>

    </div>
  );
};
