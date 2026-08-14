import React, { useState, useRef } from 'react';
import { 
  Search, 
  Mic, 
  Sparkles, 
  ArrowRight, 
  MapPin,
  Edit2,
  DollarSign,
  Shield,
  Briefcase,
  HelpCircle,
  AlertTriangle,
  X,
  TrendingDown,
  Activity,
  CheckCircle2,
  Zap,
  ShoppingBag
} from 'lucide-react';
import type { Language, Requirement } from '../types';
import { SAMPLE_PROMPTS, SamplePrompt } from '../data/samplePrompts';
import { analyzeRequirement } from '../services/requirementAgent';

interface CustomerDashboardProps {
  language: Language;
  onOpenVoiceModal: () => void;
  onStartNegotiation: (req: Requirement) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  language,
  onOpenVoiceModal,
  onStartNegotiation
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [parsedReq, setParsedReq] = useState<Requirement | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showProductWarningModal, setShowProductWarningModal] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Mandatory Product Validation Handler
  const handleValidateAndProceed = (targetReq?: Requirement | null) => {
    const productToValidate = (targetReq?.product || parsedReq?.product || searchInput).trim();

    if (!productToValidate) {
      setShowProductWarningModal(true);
      return;
    }

    const finalReq = targetReq || parsedReq || analyzeRequirement(searchInput, language);
    onStartNegotiation(finalReq);
  };

  const handleTextSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) {
      setShowProductWarningModal(true);
      return;
    }
    const req = analyzeRequirement(searchInput, language);
    setParsedReq(req);
  };

  const handleSelectSample = (prompt: SamplePrompt) => {
    setSearchInput(prompt.text);
    const req = analyzeRequirement(prompt.text, prompt.language);
    setParsedReq(req);
  };

  const handleSelectQuickCard = (productText: string) => {
    setSearchInput(productText);
    const req = analyzeRequirement(productText, language);
    setParsedReq(req);
  };

  const updateChipField = (field: keyof Requirement, value: any) => {
    if (parsedReq) {
      setParsedReq({
        ...parsedReq,
        [field]: value
      });
    }
  };

  return (
    <div className="space-y-10 py-6 animate-fadeIn text-slate-100 relative overflow-hidden">
      
      {/* Ambient Floating Glow Mesh Animations */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-gradient-to-tr from-amber-500/15 via-orange-500/10 to-transparent rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-[450px] h-[450px] bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-3xl animate-pulse delay-700 pointer-events-none" />
      <div className="absolute -bottom-32 left-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-purple-500/10 via-indigo-500/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none" />

      {/* Real-Time Live Market Ticker Banner */}
      <div className="relative z-10 bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-xl backdrop-blur-md flex items-center justify-between text-xs overflow-hidden">
        <div className="flex items-center gap-2 text-emerald-400 font-bold shrink-0">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="uppercase tracking-wider text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
            Fact Bus Live Feed
          </span>
        </div>

        <div className="flex items-center gap-6 text-slate-300 font-mono text-[11px] overflow-x-auto whitespace-nowrap scrollbar-none px-4">
          <span className="flex items-center gap-1">
            <span className="text-amber-400 font-bold">Sri Lakshmi Electronics:</span> ₹58,000 
            <TrendingDown className="w-3.5 h-3.5 text-emerald-400 inline" /> (-₹6,800 drop)
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1">
            <span className="text-emerald-400 font-bold">Gadag Digital Store:</span> ₹59,200 
            <TrendingDown className="w-3.5 h-3.5 text-emerald-400 inline" /> (-₹5,600 drop)
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1">
            <span className="text-amber-300 font-bold">Hulkoti Traders:</span> ₹58,500 
            <TrendingDown className="w-3.5 h-3.5 text-emerald-400 inline" /> (-₹6,300 drop)
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-semibold font-sans">
            Average Bargain Savings: <span className="text-emerald-400 font-bold">11.3% Off Baseline</span>
          </span>
        </div>
      </div>
      
      {/* Vercel / Gemini Style Landing Hero */}
      <div className="relative z-10 text-center max-w-4xl mx-auto space-y-6 pt-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-amber-400 text-xs font-black tracking-wide shadow-md">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          Autonomous Local Market Price Discovery & Bargaining Engine
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
          Your AI agent for the <br />
          <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 bg-clip-text text-transparent">
            local offline market.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
          Eliminate price opacity. Panchayat AI discovers nearby merchants, gathers real-time competitive quotes, and bargains using shared negotiation memory.
        </p>

        {/* Primary & Secondary Hero Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => handleValidateAndProceed()}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Start a negotiation <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" /> Explore how it works
          </button>
        </div>
      </div>

      {/* How It Works Explainer Dropdown */}
      {showHowItWorks && (
        <div className="relative z-10 max-w-4xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-fadeIn space-y-4 backdrop-blur-md">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Zap className="w-4 h-4" /> How Panchayat AI Negotiates For You
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> 1. Requirement Parsing
              </div>
              <p className="text-slate-400 leading-relaxed">Specify what you want by voice or text. The Requirement Agent converts your prompt into structured constraints.</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 2. Fact Bus Memory
              </div>
              <p className="text-slate-400 leading-relaxed">Worker agents contact local merchants concurrently. Every price drop is recorded in the Fact Bus memory to leverage benchmarks.</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> 3. Multi-Factor Deal Scoring
              </div>
              <p className="text-slate-400 leading-relaxed">The Deal Intelligence Agent ranks offers using price, warranty, distance, and merchant reliability rating.</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Requirement Search Input Bar */}
      <div className="relative z-10 max-w-3xl mx-auto">
        <form onSubmit={handleTextSearch} className="relative flex items-center">
          <Search className="w-5 h-5 text-slate-500 absolute left-4 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Enter product to negotiate (e.g., 'Laptop for coding under ₹60,000')..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-32 py-4 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 shadow-2xl transition-all"
          />
          <div className="absolute right-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenVoiceModal}
              title="Voice Search (English, Hindi, Kannada, Urdu)"
              className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all flex items-center gap-1 text-xs font-bold cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">Voice</span>
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-1 cursor-pointer"
            >
              <span>Parse</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Quick Sample Prompts */}
        <div className="flex items-center gap-2 mt-3 flex-wrap text-xs">
          <span className="text-slate-500 font-semibold">Try sample prompts:</span>
          {SAMPLE_PROMPTS.slice(0, 3).map((prompt) => (
            <button
              key={prompt.id}
              onClick={() => handleSelectSample(prompt)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all cursor-pointer"
            >
              {prompt.text}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Quick Product Recommendation Cards */}
      <div className="relative z-10 max-w-4xl mx-auto space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-400" /> Popular Local Products
          </span>
          <span className="text-[11px] text-slate-500">1-click requirement fill</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => handleSelectQuickCard("Coding Laptop 16GB RAM under ₹60,000")}
            className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-left transition-all group cursor-pointer"
          >
            <div className="text-base mb-1">💻</div>
            <span className="text-xs font-extrabold text-white block group-hover:text-amber-400">Coding Laptop</span>
            <span className="text-[10px] text-slate-400 block font-mono">Budget: ₹60,000</span>
          </button>

          <button
            onClick={() => handleSelectQuickCard("55-inch 4K Smart TV under ₹45,000")}
            className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-left transition-all group cursor-pointer"
          >
            <div className="text-base mb-1">📺</div>
            <span className="text-xs font-extrabold text-white block group-hover:text-emerald-400">4K Smart TV 55"</span>
            <span className="text-[10px] text-slate-400 block font-mono">Budget: ₹45,000</span>
          </button>

          <button
            onClick={() => handleSelectQuickCard("Organic Sona Masoori Rice 25kg bag under ₹1,800")}
            className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-left transition-all group cursor-pointer"
          >
            <div className="text-base mb-1">🌾</div>
            <span className="text-xs font-extrabold text-white block group-hover:text-amber-400">Sona Rice 25kg</span>
            <span className="text-[10px] text-slate-400 block font-mono">Budget: ₹1,800</span>
          </button>

          <button
            onClick={() => handleSelectQuickCard("Bosch Heavy Duty Power Drill 750W under ₹4,200")}
            className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 text-left transition-all group cursor-pointer"
          >
            <div className="text-base mb-1">🛠️</div>
            <span className="text-xs font-extrabold text-white block group-hover:text-purple-400">Bosch Power Drill</span>
            <span className="text-[10px] text-slate-400 block font-mono">Budget: ₹4,200</span>
          </button>
        </div>
      </div>

      {/* AI Interactive Constraint Chips Experience */}
      {parsedReq && (
        <div className="relative z-10 max-w-3xl mx-auto bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-fadeIn backdrop-blur-md">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-base text-white">Extracted Requirement Constraints</h3>
            </div>
            {parsedReq.confidence && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Confidence: {Math.round(parsedReq.confidence * 100)}%
              </span>
            )}
          </div>

          {/* Interactive Editable Constraint Chips Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            
            {/* Product Chip */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Product</span>
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={parsedReq.product}
                  onChange={(e) => updateChipField('product', e.target.value)}
                  className="bg-transparent text-xs font-extrabold text-white focus:outline-none w-full"
                />
                <Edit2 className="w-3 h-3 text-slate-500 shrink-0" />
              </div>
            </div>

            {/* Category Chip */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Category</span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-400">{parsedReq.category}</span>
              </div>
            </div>

            {/* Budget Chip */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Max Budget</span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-400 font-mono">₹{parsedReq.budget.toLocaleString('en-IN')}</span>
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>

            {/* Purpose Chip */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Purpose</span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">{parsedReq.purpose || 'General Use'}</span>
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              </div>
            </div>

            {/* Location Chip */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Location</span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">{parsedReq.location}</span>
                <MapPin className="w-3.5 h-3.5 text-orange-400" />
              </div>
            </div>

            {/* Warranty Preference Chip */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Warranty</span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">{parsedReq.warranty_preference || '1 Year Preferred'}</span>
                <Shield className="w-3.5 h-3.5 text-teal-400" />
              </div>
            </div>

          </div>

          {/* Human-Readable Interpretation Box */}
          {parsedReq.human_interpretation && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 text-xs text-slate-300 font-medium leading-relaxed">
              <span className="font-bold text-amber-400 block mb-1">AI Interpretation:</span>
              "{parsedReq.human_interpretation}"
            </div>
          )}

          {/* Start Negotiation Action */}
          <button
            onClick={() => handleValidateAndProceed(parsedReq)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 text-slate-950 font-black text-sm shadow-xl shadow-orange-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Start Negotiation with Local Merchants <ArrowRight className="w-4 h-4" />
          </button>

        </div>
      )}

      {/* Mandatory Product Required Warning Modal Popup */}
      {showProductWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative text-slate-100 text-center space-y-4">
            
            <button
              onClick={() => setShowProductWarningModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto shadow-lg">
              <AlertTriangle className="w-7 h-7 text-amber-400 animate-bounce" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">Please Enter a Product to Negotiate</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                You must specify the product or item you wish to bargain for (e.g., <span className="text-amber-400 font-bold">'Laptop'</span>, <span className="text-emerald-400 font-bold">'Smart TV'</span>, <span className="text-amber-300 font-bold">'Rice 25kg'</span>) before initiating local merchant price discovery.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowProductWarningModal(false);
                  if (searchInputRef.current) {
                    searchInputRef.current.focus();
                  }
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/25 transition-all cursor-pointer hover:opacity-90 flex items-center justify-center gap-1.5"
              >
                <Search className="w-4 h-4" /> Enter Product Now
              </button>

              <button
                onClick={() => {
                  handleSelectQuickCard("Coding Laptop 16GB RAM under ₹60,000");
                  setShowProductWarningModal(false);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                Or Use Sample: "Coding Laptop 16GB RAM"
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
