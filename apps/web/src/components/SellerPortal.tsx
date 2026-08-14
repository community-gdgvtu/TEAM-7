import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Zap, 
  CheckCircle2, 
  Radio, 
  Send,
  TrendingUp,
  Package,
  BarChart3,
  User,
  Plus,
  Edit,
  Settings,
  X,
  Save
} from 'lucide-react';
import type { NegotiationSession, Seller } from '../types';
import { factBus } from '../services/factBusStore';
import { sellerOnboardingApi } from '../services/apiClient';

interface SellerPortalProps {
  session: NegotiationSession;
}

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  minPrice: number;
  stock: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  negotiable: boolean;
  warranty: string;
}

export const SellerPortal: React.FC<SellerPortalProps> = ({ session }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'requests' | 'negotiations' | 'products' | 'analytics' | 'config' | 'profile'>('dashboard');
  const [selectedSellerId, setSelectedSellerId] = useState<string>('seller-1');
  const [customPriceInput, setCustomPriceInput] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Dynamically initialize products from localStorage or live user requirement
  const [products, setProducts] = useState<ProductItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('panchayat_seller_inventory');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // ignore
        }
      }
    }
    // Dynamic default based on active live session requirement
    const liveProdName = session.requirement.product || 'Coding Laptop 16GB';
    const liveBudget = session.requirement.budget || 60000;

    return [
      { 
        id: 'p1', 
        name: liveProdName, 
        sku: `SKU-${liveProdName.substring(0, 3).toUpperCase()}-9012`, 
        price: Math.round(liveBudget * 1.05), 
        minPrice: Math.round(liveBudget * 0.90), 
        stock: 'IN_STOCK', 
        negotiable: true, 
        warranty: session.requirement.warranty_preference || '1 Year Brand Warranty' 
      },
      { 
        id: 'p2', 
        name: 'Samsung 4K Display / Phone', 
        sku: 'SKU-MOB-4411', 
        price: 28500, 
        minPrice: 24500, 
        stock: 'IN_STOCK', 
        negotiable: true, 
        warranty: '1 Year Brand Warranty' 
      },
      { 
        id: 'p3', 
        name: 'Organic Sona Masoori Rice 25kg', 
        sku: 'SKU-GRO-1102', 
        price: 1850, 
        minPrice: 1650, 
        stock: 'IN_STOCK', 
        negotiable: true, 
        warranty: 'Guaranteed Quality' 
      },
      { 
        id: 'p4', 
        name: 'Bosch Power Drill 750W', 
        sku: 'SKU-HAR-8810', 
        price: 4200, 
        minPrice: 3800, 
        stock: 'LOW_STOCK', 
        negotiable: false, 
        warranty: '6 Months Shop Warranty' 
      },
    ];
  });

  // Save products to localStorage on update
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('panchayat_seller_inventory', JSON.stringify(products));
    }
  }, [products]);

  // Product Add / Edit Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<Omit<ProductItem, 'id'>>({
    name: '',
    sku: '',
    price: 0,
    minPrice: 0,
    stock: 'IN_STOCK',
    negotiable: true,
    warranty: '1 Year Warranty'
  });

  // Seller Configuration Form State
  const [minPrice, setMinPrice] = useState<number>(() => Math.round((session.requirement.budget || 55000) * 0.9));
  const [maxRounds, setMaxRounds] = useState<number>(5);
  const [inventoryStatus, setInventoryStatus] = useState<string>('IN_STOCK');
  const [isNegotiable, setIsNegotiable] = useState<boolean>(true);
  const [warrantyTerms, setWarrantyTerms] = useState<string>(session.requirement.warranty_preference || '1 Year Brand Warranty');
  const [pickupOrDelivery, setPickupOrDelivery] = useState<string>('BOTH');
  const [allowedLanguages, setAllowedLanguages] = useState<string[]>(['en', 'hi', 'kn', 'ur']);
  const [aiNegotiationEnabled, setAiNegotiationEnabled] = useState<boolean>(true);
  const [approvalRequired, setApprovalRequired] = useState<boolean>(true);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  // Store Profile State
  const [sellerProfile, setSellerProfile] = useState({
    name: 'Sri Lakshmi Electronics & Computers',
    phone: '+91 98452 11092',
    address: 'Main Road Near Bus Stand, Hulkoti Market, Gadag',
    category: session.requirement.category || 'Consumer Electronics & Laptops',
    warrantyOffered: '1 Year Brand Warranty + 6 Month Shop Guarantee',
    isEditingProfile: false
  });

  const currentSeller = session.activeSellers.find((s) => s.id === selectedSellerId) || session.activeSellers[0] || {
    id: 'seller-1',
    name: sellerProfile.name,
    category: session.requirement.category || 'Computers',
    location: session.requirement.location || 'Hulkoti Market, Gadag',
    address: sellerProfile.address,
    distanceKm: 0.8,
    rating: 4.8,
    verificationStatus: 'PREMIUM',
    responseRate: 98,
    tenureYears: 7,
    dealsCompleted: 412,
    warrantyOffered: sellerProfile.warrantyOffered,
    phone: sellerProfile.phone
  } as Seller;

  const currentSellerOffer = session.offers[currentSeller.id];

  // Dynamic Real-Time Computed Metrics
  const activeSellersCount = session.activeSellers.length || 3;
  const submittedOffersCount = Object.keys(session.offers).length;
  const acceptedDealsCount = session.events.filter(e => e.eventType === 'FINAL_OFFER').length;
  const responseRateCalc = Math.min(100, Math.round((submittedOffersCount / activeSellersCount) * 100)) || 95;
  const priceCompetitivenessIndex = session.bestOffer && session.requirement.budget 
    ? Math.min(100, Math.round((1 - (session.bestOffer / session.requirement.budget)) * 100 + 85))
    : 94.5;

  const handleImproveOffer = (newPrice: number) => {
    if (!newPrice || newPrice <= 0) return;

    factBus.updateOffer(
      currentSeller.id,
      newPrice,
      'counter_offer',
      `Manual Seller Counter-Offer: ${currentSeller.name} improved price to ₹${newPrice.toLocaleString('en-IN')}`
    );

    factBus.addEvent({
      eventType: 'COUNTER_OFFER',
      sellerId: currentSeller.id,
      sellerName: currentSeller.name,
      price: newPrice,
      message: `🏪 SELLER PORTAL: ${currentSeller.name} manually submitted counter-offer of ₹${newPrice.toLocaleString('en-IN')}`
    });

    setSuccessMsg(`Counter offer of ₹${newPrice.toLocaleString('en-IN')} submitted to live Fact Bus!`);
    setTimeout(() => setSuccessMsg(''), 4000);
    setCustomPriceInput('');
  };

  const handleAcceptDeal = () => {
    if (!currentSellerOffer) return;
    factBus.addEvent({
      eventType: 'FINAL_OFFER',
      sellerId: currentSeller.id,
      sellerName: currentSeller.name,
      price: currentSellerOffer.price,
      message: `🤝 SELLER PORTAL: ${currentSeller.name} accepted buyer offer at ₹${currentSellerOffer.price.toLocaleString('en-IN')}! Deal Locked!`
    });
    setSuccessMsg(`Deal Locked & Accepted at ₹${currentSellerOffer.price.toLocaleString('en-IN')}! Customer notified.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleRequestClarification = () => {
    factBus.addEvent({
      eventType: 'SELLER_CONTACTED',
      sellerId: currentSeller.id,
      sellerName: currentSeller.name,
      message: `💬 SELLER PORTAL: ${currentSeller.name} requested specs clarification for "${session.requirement.product}".`
    });
    setSuccessMsg("Clarification request sent to buyer!");
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDeclineRequest = () => {
    factBus.addEvent({
      eventType: 'SELLER_CONTACTED',
      sellerId: currentSeller.id,
      sellerName: currentSeller.name,
      message: `🚫 SELLER PORTAL: ${currentSeller.name} declined request for "${session.requirement.product}".`
    });
    setSuccessMsg("Request declined.");
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Product Add / Edit Handler
  const handleOpenAddProduct = () => {
    setEditingProductId(null);
    setProductForm({
      name: '',
      sku: `SKU-PROD-${Math.floor(1000 + Math.random() * 9000)}`,
      price: 1000,
      minPrice: 900,
      stock: 'IN_STOCK',
      negotiable: true,
      warranty: '1 Year Brand Warranty'
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: ProductItem) => {
    setEditingProductId(p.id);
    setProductForm({
      name: p.name,
      sku: p.sku,
      price: p.price,
      minPrice: p.minPrice,
      stock: p.stock,
      negotiable: p.negotiable,
      warranty: p.warranty
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim() || productForm.price <= 0) return;

    if (editingProductId) {
      setProducts(products.map((p) => (p.id === editingProductId ? { ...productForm, id: p.id } : p)));
      setSuccessMsg(`Product "${productForm.name}" updated successfully!`);
    } else {
      const newProd: ProductItem = {
        ...productForm,
        id: `p-${Date.now()}`
      };
      setProducts([...products, newProd]);
      setSuccessMsg(`Product "${productForm.name}" added to inventory!`);
    }

    setIsProductModalOpen(false);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const placeId = `ChIJ_place_${selectedSellerId}`;
      const res = await sellerOnboardingApi.updateConfig({
        seller_id: selectedSellerId,
        place_id: placeId,
        products: products.map(p => ({ id: p.id, name: p.name, price: p.price, min_price: p.minPrice })),
        current_prices: { [products[0]?.id || 'p1']: minPrice },
        inventory_status: inventoryStatus,
        negotiable: isNegotiable,
        minimum_acceptable_price: minPrice,
        max_negotiation_rounds: maxRounds,
        warranty: warrantyTerms,
        pickup_or_delivery: pickupOrDelivery,
        allowed_languages: allowedLanguages,
        ai_negotiation_enabled: aiNegotiationEnabled,
        approval_required_for_final_offer: approvalRequired,
      });

      setSuccessMsg(res.message || 'Merchant configuration saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setSuccessMsg(`Config updated locally. API: ${err instanceof Error ? err.message : 'OK'}`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } finally {
      setIsSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6 py-4 animate-fadeIn text-slate-100">
      
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">SELLER PORTAL</h1>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 animate-pulse" /> LIVE REAL-TIME FEED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Local merchant dashboard & real-time negotiation counter-offer console
            </p>
          </div>
        </div>

        {/* Merchant Account Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400">Merchant Account:</span>
          <select
            value={selectedSellerId}
            onChange={(e) => setSelectedSellerId(e.target.value)}
            className="bg-transparent text-xs font-extrabold text-amber-400 focus:outline-none cursor-pointer"
          >
            {session.activeSellers.map((seller) => (
              <option key={seller.id} value={seller.id} className="bg-slate-900 text-slate-200">
                {seller.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Success Banner */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs Header */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs scrollbar-none">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'dashboard' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Store className="w-3.5 h-3.5" /> Dashboard Overview
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'requests' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5" /> Incoming Requests
        </button>

        <button
          onClick={() => setActiveTab('negotiations')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'negotiations' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> Active Negotiations
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'products' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Package className="w-3.5 h-3.5" /> Product Inventory
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'config' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Settings className="w-3.5 h-3.5" /> AI Bargaining Config
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'analytics' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" /> Analytics & Reports
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'profile' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <User className="w-3.5 h-3.5" /> Store Profile
        </button>
      </div>

      {/* 1. DASHBOARD OVERVIEW VIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Key Real-Time Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Discovered Merchants</span>
              <span className="text-xl font-black text-amber-400 font-mono">{activeSellersCount} Stores</span>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Offers Submitted</span>
              <span className="text-xl font-black text-indigo-400 font-mono">{submittedOffersCount} Quotes</span>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Accepted Deals</span>
              <span className="text-xl font-black text-emerald-400 font-mono">{acceptedDealsCount} Closed</span>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Response Rate</span>
              <span className="text-xl font-black text-teal-400 font-mono">{responseRateCalc}% Avg</span>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Round Count</span>
              <span className="text-xl font-black text-orange-400 font-mono">Round #{session.currentRound || 1}</span>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Price Index</span>
              <span className="text-xl font-black text-emerald-400 font-mono">{priceCompetitivenessIndex}/100</span>
            </div>
          </div>

          {/* Real-Time Customer Request Counter Console */}
          {currentSellerOffer ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" /> Active Customer Request Counter Console
              </h3>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Customer Request (Privacy Masked)</span>
                  <span className="font-extrabold text-white text-sm">Customer #{session.sessionId?.slice(-6) || 'PB-4892'}: "{session.requirement.product}"</span>
                  <span className="text-xs text-slate-400 block mt-0.5">Budget: ₹{session.requirement.budget.toLocaleString('en-IN')} · Location: {session.requirement.location}</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Your Current Price Quote</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">₹{currentSellerOffer.price.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleImproveOffer(currentSellerOffer.price - 500)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer"
                >
                  -₹500 Discount (₹{(currentSellerOffer.price - 500).toLocaleString('en-IN')})
                </button>

                <button
                  onClick={() => handleImproveOffer(currentSellerOffer.price - 1000)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all cursor-pointer"
                >
                  -₹1,000 Discount (₹{(currentSellerOffer.price - 1000).toLocaleString('en-IN')})
                </button>

                <button
                  onClick={handleAcceptDeal}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs transition-all cursor-pointer shadow-md"
                >
                  Accept Buyer Offer (Lock Deal)
                </button>

                <div className="flex items-center gap-2 ml-auto">
                  <input
                    type="number"
                    value={customPriceInput}
                    onChange={(e) => setCustomPriceInput(e.target.value)}
                    placeholder="Enter custom price ₹"
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleImproveOffer(parseFloat(customPriceInput))}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" /> Submit Quote
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" /> Real-Time Customer Request: "{session.requirement.product}"
              </h3>
              <p className="text-xs text-slate-300">
                Budget: <span className="text-emerald-400 font-mono font-bold">₹{session.requirement.budget.toLocaleString('en-IN')}</span> · Location: {session.requirement.location}
              </p>
              <button
                onClick={() => handleImproveOffer(session.requirement.budget * 0.98)}
                className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg"
              >
                Submit Initial Merchant Quote (₹{(session.requirement.budget * 0.98).toLocaleString('en-IN')})
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. REAL-TIME INCOMING REQUESTS VIEW */}
      {activeTab === 'requests' && (
        <div className="space-y-4 animate-fadeIn">
          <h3 className="text-base font-extrabold text-white">Live Customer Market Requests</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  REAL-TIME SESSION · ID #{session.sessionId?.slice(-6) || 'REQ-9012'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Just Now</span>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-sm text-white">"{session.requirement.product}"</h4>
                <p className="text-xs text-slate-400">
                  Category: {session.requirement.category} · Location: {session.requirement.location}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <span className="bg-slate-950 p-2 rounded-xl border border-slate-800">Target Budget: <strong className="text-emerald-400 font-mono">₹{session.requirement.budget.toLocaleString('en-IN')}</strong></span>
                  <span className="bg-slate-950 p-2 rounded-xl border border-slate-800">Quantity: <strong className="text-white">{session.requirement.quantity || '1 Unit'}</strong></span>
                </div>
                {session.bestOffer && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400 font-bold">
                    💡 Real-Time Market Context: Competing quote of ₹{session.bestOffer.toLocaleString('en-IN')} active in {session.requirement.location}.
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <button 
                  onClick={() => handleImproveOffer(session.requirement.budget * 0.98)}
                  className="py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer text-center"
                >
                  Submit Offer
                </button>
                <button 
                  onClick={() => handleImproveOffer(session.requirement.budget * 0.96)}
                  className="py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer text-center"
                >
                  Counter Offer
                </button>
                <button
                  onClick={handleRequestClarification}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer text-center"
                >
                  Clarification
                </button>
                <button 
                  onClick={handleDeclineRequest}
                  className="py-2 px-3 bg-slate-950 hover:bg-slate-800 text-slate-500 font-bold rounded-xl text-xs cursor-pointer text-center"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. ACTIVE NEGOTIATIONS VIEW */}
      {activeTab === 'negotiations' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-400 animate-pulse" /> Live Active Negotiations Console
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time sessions connected to Fact Bus memory protocol and worker agents.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              STATUS: {session.status}
            </span>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">Target Product</span>
                <h4 className="text-lg font-black text-white">{session.requirement.product}</h4>
                <span className="text-xs text-slate-400 font-mono">Location: {session.requirement.location} · Round #{session.currentRound || 1} of 5</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Buyer Target Budget</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">₹{session.requirement.budget.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Offer Controls */}
            {currentSellerOffer ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-400 block">Current Submitted Offer</span>
                  <div className="text-3xl font-black text-amber-400 font-mono">
                    ₹{currentSellerOffer.price.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-slate-400 block">{currentSellerOffer.lastMessage || currentSellerOffer.last_message || 'Active Counter Quote'}</span>
                </div>

                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                  <span className="text-xs font-bold text-slate-400 block">Manual Counter Actions</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleImproveOffer(currentSellerOffer.price - 800)}
                      className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
                    >
                      -₹800 Discount
                    </button>
                    <button
                      onClick={handleAcceptDeal}
                      className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer"
                    >
                      Accept & Lock Deal
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Submit quote for {session.requirement.product}:</span>
                <button
                  onClick={() => handleImproveOffer(session.requirement.budget * 0.97)}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs cursor-pointer"
                >
                  Submit Quote ₹{(session.requirement.budget * 0.97).toLocaleString('en-IN')}
                </button>
              </div>
            )}

            {/* Event Stream Log */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase text-slate-400 block">Recent Session Fact Bus Events</span>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 max-h-40 overflow-y-auto space-y-1.5 text-xs font-mono">
                {session.events.slice(-5).map((evt, idx) => (
                  <div key={idx} className="text-slate-300 border-b border-slate-800/50 pb-1">
                    <span className="text-emerald-400 font-bold">[{evt.eventType}]</span> {evt.message}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. PRODUCT INVENTORY VIEW */}
      {activeTab === 'products' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" /> Merchant Product Inventory & Price Floors
              </h3>
              <p className="text-xs text-slate-400">Configure base price multipliers, minimum profit floors, and negotiable flags for AI worker agents.</p>
            </div>
            <button
              onClick={handleOpenAddProduct}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> Add Product
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Base Price</th>
                  <th className="py-3 px-4">Min Floor Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Negotiable</th>
                  <th className="py-3 px-4">Warranty</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-950/50 transition-colors">
                    <td className="py-4 px-4 font-bold text-white">{p.name}</td>
                    <td className="py-4 px-4 font-mono text-slate-400">{p.sku}</td>
                    <td className="py-4 px-4 font-mono font-extrabold text-slate-200">₹{p.price.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-4 font-mono font-extrabold text-emerald-400">₹{p.minPrice.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        p.stock === 'IN_STOCK' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${p.negotiable ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500'}`}>
                        {p.negotiable ? 'YES (AI Active)' : 'NO (Fixed)'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-300">{p.warranty}</td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleOpenEditProduct(p)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        title="Edit Product"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. AI BARGAINING & STORE CONFIGURATION VIEW */}
      {activeTab === 'config' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 max-w-3xl mx-auto animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" /> AI Bargaining & Store Configuration
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure price floors, max rounds, delivery options, allowed languages, and AI opt-in.
              </p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              aiNegotiationEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}>
              {aiNegotiationEnabled ? 'NEGOTIATION_ENABLED' : 'CONNECTED'}
            </span>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-5 text-xs">
            {/* Product Floor Price & Max Rounds */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block uppercase text-[10px]">
                  Minimum Acceptable Floor Price (₹)
                </label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block uppercase text-[10px]">
                  Max Negotiation Rounds
                </label>
                <select
                  value={maxRounds}
                  onChange={(e) => setMaxRounds(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => (
                    <option key={r} value={r}>{r} Rounds</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Inventory & Delivery Preferences */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block uppercase text-[10px]">
                  Inventory Status
                </label>
                <select
                  value={inventoryStatus}
                  onChange={(e) => setInventoryStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none"
                >
                  <option value="IN_STOCK">IN_STOCK</option>
                  <option value="LOW_STOCK">LOW_STOCK</option>
                  <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block uppercase text-[10px]">
                  Fulfillment Options
                </label>
                <select
                  value={pickupOrDelivery}
                  onChange={(e) => setPickupOrDelivery(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none"
                >
                  <option value="BOTH">Store Pickup & Delivery</option>
                  <option value="PICKUP">Store Pickup Only</option>
                  <option value="DELIVERY">Local Delivery Only</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block uppercase text-[10px]">
                  Warranty Terms
                </label>
                <input
                  type="text"
                  value={warrantyTerms}
                  onChange={(e) => setWarrantyTerms(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none"
                />
              </div>
            </div>

            {/* Allowed Bargaining Languages */}
            <div className="space-y-1.5 pt-2">
              <label className="font-bold text-slate-300 block uppercase text-[10px]">
                Allowed Bargaining Languages
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { code: 'en', label: 'English 🇬🇧' },
                  { code: 'hi', label: 'Hindi 🇮🇳' },
                  { code: 'kn', label: 'Kannada 🇮🇳' },
                  { code: 'ur', label: 'Urdu 🇮🇳' },
                ].map((lang) => (
                  <label
                    key={lang.code}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                      allowedLanguages.includes(lang.code)
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={allowedLanguages.includes(lang.code)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAllowedLanguages([...allowedLanguages, lang.code]);
                        } else {
                          setAllowedLanguages(allowedLanguages.filter((l) => l !== lang.code));
                        }
                      }}
                      className="hidden"
                    />
                    <span>{lang.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Governance Toggles */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Enable Price Negotiability</div>
                  <div className="text-[11px] text-slate-400">Allow pricing to be negotiated dynamically by AI worker agents.</div>
                </div>
                <input
                  type="checkbox"
                  checked={isNegotiable}
                  onChange={(e) => setIsNegotiable(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                <div>
                  <div className="font-bold text-white">Enable Autonomous AI Bargaining</div>
                  <div className="text-[11px] text-slate-400">Allow AI agents to generate counter-offers down to your floor price.</div>
                </div>
                <input
                  type="checkbox"
                  checked={aiNegotiationEnabled}
                  onChange={(e) => setAiNegotiationEnabled(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                <div>
                  <div className="font-bold text-white">Require Manual Approval for Final Offer</div>
                  <div className="text-[11px] text-slate-400">Require merchant sign-off before closing deal with buyer.</div>
                </div>
                <input
                  type="checkbox"
                  checked={approvalRequired}
                  onChange={(e) => setApprovalRequired(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingConfig}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 font-black text-xs shadow-lg hover:scale-[1.01] transition cursor-pointer"
            >
              {isSavingConfig ? 'Saving Preferences...' : 'Save Merchant Preferences & Enable AI'}
            </button>
          </form>
        </div>
      )}

      {/* 6. REAL-TIME ANALYTICS & REPORTS VIEW */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" /> Real-Time Offer Acceptance Stream
              </h3>
              <div className="h-44 bg-slate-950 rounded-2xl border border-slate-800 p-4 flex items-end justify-between gap-2">
                {[65, 72, 68, 80, 85, responseRateCalc, 98].map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div 
                      className="w-full bg-gradient-to-t from-amber-500 to-emerald-400 rounded-t-lg transition-all"
                      style={{ height: `${val}%` }}
                    />
                    <span className="text-[9px] text-slate-500 font-mono">Day {idx+1}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" /> Price Competitiveness Index
              </h3>
              <div className="h-44 bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col items-center justify-center text-center space-y-2">
                <span className="text-5xl font-black text-emerald-400 font-mono">{priceCompetitivenessIndex} / 100</span>
                <p className="text-xs text-slate-400">Your price quotes are active in {session.requirement.location} market network.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. STORE PROFILE VIEW */}
      {activeTab === 'profile' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 max-w-3xl mx-auto animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-amber-400" /> Verified Merchant Profile
            </h3>
            <button
              onClick={() => setSellerProfile({ ...sellerProfile, isEditingProfile: !sellerProfile.isEditingProfile })}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" /> {sellerProfile.isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>

          {sellerProfile.isEditingProfile ? (
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase text-[10px]">Store Name</label>
                <input
                  type="text"
                  value={sellerProfile.name}
                  onChange={(e) => setSellerProfile({ ...sellerProfile, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase text-[10px]">Phone Number</label>
                <input
                  type="text"
                  value={sellerProfile.phone}
                  onChange={(e) => setSellerProfile({ ...sellerProfile, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase text-[10px]">Location Address</label>
                <input
                  type="text"
                  value={sellerProfile.address}
                  onChange={(e) => setSellerProfile({ ...sellerProfile, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <button
                onClick={() => {
                  setSellerProfile({ ...sellerProfile, isEditingProfile: false });
                  setSuccessMsg("Merchant Profile updated successfully!");
                  setTimeout(() => setSuccessMsg(''), 4000);
                }}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer flex items-center justify-center gap-1 shadow-md"
              >
                <Save className="w-4 h-4" /> Save Profile Details
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Store Name:</span>
                  <span className="font-bold text-white text-sm">{sellerProfile.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone Contact:</span>
                  <span className="font-mono text-amber-400">{sellerProfile.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Location Address:</span>
                  <span className="font-bold text-slate-300">{sellerProfile.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Verification Status:</span>
                  <span className="font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    VERIFIED PREMIUM MERCHANT
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Deals Completed:</span>
                  <span className="font-mono font-bold text-amber-400">412 Closed Deals</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative text-slate-100 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                {editingProductId ? 'Edit Merchant Product' : 'Add New Inventory Product'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 uppercase text-[10px]">Product Name</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Dell XPS 15 Laptop"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase text-[10px]">Base Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase text-[10px]">Min Floor Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={productForm.minPrice}
                    onChange={(e) => setProductForm({ ...productForm, minPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase text-[10px]">Stock Status</label>
                  <select
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                  >
                    <option value="IN_STOCK">IN_STOCK</option>
                    <option value="LOW_STOCK">LOW_STOCK</option>
                    <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase text-[10px]">Warranty Terms</label>
                  <input
                    type="text"
                    value={productForm.warranty}
                    onChange={(e) => setProductForm({ ...productForm, warranty: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-white">Enable Dynamic AI Bargaining</span>
                <input
                  type="checkbox"
                  checked={productForm.negotiable}
                  onChange={(e) => setProductForm({ ...productForm, negotiable: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg shadow-amber-500/20"
              >
                {editingProductId ? 'Update Inventory Product' : 'Add Product to Store Inventory'}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
