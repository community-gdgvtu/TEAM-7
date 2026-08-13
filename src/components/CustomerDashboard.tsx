import React, { useState } from 'react';
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
  HelpCircle
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

  const handleTextSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const req = analyzeRequirement(searchInput, language);
      setParsedReq(req);
    }
  };

  const handleSelectSample = (prompt: SamplePrompt) => {
    setSearchInput(prompt.text);
    const req = analyzeRequirement(prompt.text, prompt.language);
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
    <div className="space-y-12 py-6 animate-fadeIn text-slate-100">
      
      {/* Vercel / Gemini Style Landing Hero */}
      <div className="text-center max-w-4xl mx-auto space-y-6 pt-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-amber-400 text-xs font-bold tracking-wide shadow-md">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          Autonomous Local Market Price Discovery & Negotiation Agent
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
          Your AI agent for the <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 bg-clip-text text-transparent">local market.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-medium">
          Eliminate offline price opacity. Panchayat AI discovers local merchants, collects competitive quotes, and leverages shared negotiation memory to secure the best deal.
        </p>

        {/* Primary & Secondary Hero Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              if (parsedReq) {
                onStartNegotiation(parsedReq);
              } else {
                const req = analyzeRequirement("I need a laptop for coding under ₹60,000.", language);
                onStartNegotiation(req);
              }
            }}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Start a negotiation <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" /> Explore how it works
          </button>
        </div>
      </div>

      {/* How It Works Explainer Dropdown */}
      {showHowItWorks && (
        <div className="max-w-4xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-fadeIn space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">How Panchayat AI Negotiates For You</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <div className="font-bold text-white mb-1">1. Requirement Parsing</div>
              <p className="text-slate-400">Specify what you want by voice or text. The Requirement Agent converts your prompt into structured constraints.</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <div className="font-bold text-white mb-1">2. Fact Bus Memory</div>
              <p className="text-slate-400">Worker agents contact local merchants concurrently. Every price drop is recorded in the Fact Bus memory to leverage benchmarks.</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <div className="font-bold text-white mb-1">3. Multi-Factor Deal Scoring</div>
              <p className="text-slate-400">The Deal Intelligence Agent ranks offers using price, warranty, distance, and merchant reliability rating.</p>
            </div>
          </div>
        </div>
      )}

      {/* Search Input Bar & Voice Trigger */}
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleTextSearch} className="relative flex items-center">
          <Search className="w-5 h-5 text-slate-500 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tell Panchayat AI what you want to buy (e.g., 'Laptop for coding under ₹60,000')..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-28 py-4 text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 shadow-2xl transition-all"
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
              className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Sample Prompt Chips */}
        <div className="flex items-center gap-2 mt-4 flex-wrap text-xs">
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

      {/* AI Interactive Constraint Chips Experience */}
      {parsedReq && (
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-fadeIn">
          
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
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 text-xs text-slate-300 font-medium">
              <span className="font-bold text-amber-400 block mb-1">AI Interpretation:</span>
              "{parsedReq.human_interpretation}"
            </div>
          )}

          {/* Start Negotiation Action */}
          <button
            onClick={() => onStartNegotiation(parsedReq)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 text-slate-950 font-black text-sm shadow-xl shadow-orange-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Start Negotiation with Local Merchants <ArrowRight className="w-4 h-4" />
          </button>

        </div>
      )}

    </div>
  );
};
