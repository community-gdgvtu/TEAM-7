import React, { useState } from 'react';
import { X, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authStore } from '../stores/authStore';
import type { ProductCategory } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
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

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const token = `jwt-token-${Date.now()}`;
      const mockUser = {
        id: `usr-${Date.now()}`,
        email,
        name: email.split('@')[0],
        role: (email.includes('seller') ? 'SELLER' : email.includes('admin') ? 'ADMIN' : 'CUSTOMER') as any,
        phone,
        location: 'Hulkoti Market, Gadag',
        created_at: new Date().toISOString()
      };

      authStore.setSession(token, mockUser);
      setSuccessMsg(`Welcome back, ${mockUser.name}! (Role: ${mockUser.role})`);
      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
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
      setSuccessMsg(`Account created successfully! Logged in as ${name}.`);
      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 1000);
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
        name,
        role: 'SELLER' as const,
        phone,
        location: address,
        created_at: new Date().toISOString()
      };

      authStore.setSession(token, newSellerUser);
      setSuccessMsg(`Merchant store "${shopName}" (${category}) registered! Role: SELLER.`);
      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Merchant registration failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative overflow-hidden text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-white">
              {tab === 'LOGIN' ? 'Sign In to Panchayat AI' : tab === 'REGISTER_CUSTOMER' ? 'Customer Registration' : 'Merchant Store Onboarding'}
            </h3>
            <p className="text-xs text-slate-400">Secure JWT Authentication & Role Permissions</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6 text-xs font-bold">
          <button
            onClick={() => { setTab('LOGIN'); setErrorMsg(''); }}
            className={`flex-1 py-2 rounded-lg transition-all ${tab === 'LOGIN' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('REGISTER_CUSTOMER'); setErrorMsg(''); }}
            className={`flex-1 py-2 rounded-lg transition-all ${tab === 'REGISTER_CUSTOMER' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Buyer
          </button>
          <button
            onClick={() => { setTab('REGISTER_SELLER'); setErrorMsg(''); }}
            className={`flex-1 py-2 rounded-lg transition-all ${tab === 'REGISTER_SELLER' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
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
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? 'Authenticating...' : 'Sign In & Issue JWT'} <ArrowRight className="w-4 h-4" />
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
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition-all"
            >
              {isLoading ? 'Creating Account...' : 'Create Buyer Account (Role: CUSTOMER)'}
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
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all"
            >
              {isLoading ? 'Onboarding Store...' : 'Register Store (Role: SELLER)'}
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
  );
};
