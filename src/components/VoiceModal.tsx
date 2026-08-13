import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Sparkles, X, CheckCircle2, AlertCircle, Edit2, ArrowRight, Loader2 } from 'lucide-react';
import type { Language, Requirement } from '../types';
import { voiceEngine } from '../services/voiceEngine';
import { analyzeRequirement } from '../services/requirementAgent';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onVoiceRequirementReady?: (req: Requirement) => void;
  onConfirmRequirement?: (req: Requirement) => void;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  language,
  onVoiceRequirementReady,
  onConfirmRequirement
}) => {
  const [voiceStep, setVoiceStep] = useState<'Listening' | 'Processing' | 'Understanding' | 'Confirming' | 'Negotiating'>('Listening');
  const [selectedLang, setSelectedLang] = useState<Language>(language);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textFallback, setTextFallback] = useState('');
  const [extractedReq, setExtractedReq] = useState<Requirement | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Voice modal state

  useEffect(() => {
    if (isOpen) {
      setVoiceStep('Listening');
      handleStartListening();
    } else {
      voiceEngine.stopListening();
      setIsListening(false);
    }
  }, [isOpen, selectedLang]);

  const handleStartListening = () => {
    setTranscript('');
    setErrorMsg('');
    setIsListening(true);
    setVoiceStep('Listening');

    voiceEngine.startListening({
      language: selectedLang,
      onResult: (text) => {
        setTranscript(text);
        if (text.length > 3) {
          setVoiceStep('Processing');
          setTimeout(() => {
            const req = analyzeRequirement(text, selectedLang);
            setExtractedReq(req);
            setVoiceStep('Confirming');
          }, 600);
        }
      },
      onError: (err) => {
        setErrorMsg(err || 'Microphone access denied or Web Speech API unavailable in browser.');
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });
  };

  const handleConfirm = () => {
    const callback = onVoiceRequirementReady || onConfirmRequirement;
    if (!callback) return;

    setVoiceStep('Negotiating');
    setTimeout(() => {
      if (extractedReq) {
        callback(extractedReq);
      } else {
        const query = textFallback || transcript || "I need a laptop under ₹60,000";
        const req = analyzeRequirement(query, selectedLang);
        callback(req);
      }
      onClose();
    }, 400);
  };

  const handleTextFallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textFallback.trim()) {
      const req = analyzeRequirement(textFallback, selectedLang);
      setExtractedReq(req);
      setVoiceStep('Confirming');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn text-slate-100">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-full transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <Mic className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Multi-Lingual Voice Search</h3>
              <p className="text-xs text-slate-400">Speak naturally in English, Hindi, Kannada or Urdu</p>
            </div>
          </div>

          {/* Language Selector */}
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value as Language)}
            className="bg-slate-950 border border-slate-800 text-xs font-bold text-amber-400 rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="en">English (en-IN)</option>
            <option value="hi">Hindi (hi-IN)</option>
            <option value="kn">Kannada (kn-IN)</option>
            <option value="ur">Urdu (ur-IN)</option>
          </select>
        </div>

        {/* Voice Step Indicator Bar */}
        <div className="grid grid-cols-5 gap-1 text-[10px] uppercase font-bold text-center">
          {['Listening', 'Processing', 'Understanding', 'Confirming', 'Negotiating'].map((step) => (
            <span
              key={step}
              className={`py-1 rounded-md transition-all ${
                voiceStep === step 
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md' 
                  : 'bg-slate-950 text-slate-500 border border-slate-800'
              }`}
            >
              {step}
            </span>
          ))}
        </div>

        {/* Pulsing Voice Visualizer */}
        <div className="flex flex-col items-center justify-center my-4">
          <button
            onClick={isListening ? () => { voiceEngine.stopListening(); setIsListening(false); } : handleStartListening}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl cursor-pointer ${
              isListening
                ? 'bg-amber-500 text-slate-950 shadow-amber-500/40 ring-8 ring-amber-500/20 scale-105'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isListening ? (
              <Mic className="w-10 h-10 animate-pulse" />
            ) : (
              <MicOff className="w-10 h-10 text-slate-500" />
            )}
          </button>
          <span className="text-xs font-bold text-slate-400 mt-3">
            {isListening ? 'Listening... Speak your request now' : 'Click microphone to start listening'}
          </span>
        </div>

        {/* Speech Transcript Output Box */}
        {transcript && (
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">Live Speech Transcript</span>
            <p className="text-xs text-slate-200 font-medium italic">"{transcript}"</p>
          </div>
        )}

        {/* Interpreted Requirement Constraints (Confirming Step) */}
        {extractedReq && (
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> AI Interpreted Requirements
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                Confidence: {Math.round((extractedReq.confidence || 0.94) * 100)}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Product</span>
                <input
                  type="text"
                  value={extractedReq.product}
                  onChange={(e) => setExtractedReq({ ...extractedReq, product: e.target.value })}
                  className="bg-transparent font-bold text-white focus:outline-none w-full"
                />
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Budget</span>
                <input
                  type="number"
                  value={extractedReq.budget}
                  onChange={(e) => setExtractedReq({ ...extractedReq, budget: parseFloat(e.target.value) || 0 })}
                  className="bg-transparent font-mono font-bold text-emerald-400 focus:outline-none w-full"
                />
              </div>
            </div>

            <button
              onClick={handleConfirm}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 text-slate-950 font-black text-xs shadow-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              Confirm & Start Negotiation <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Text Fallback Input Bar (Handles Mic Failure Gracefully) */}
        {errorMsg && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg} Use text fallback below:</span>
            </div>

            <form onSubmit={handleTextFallbackSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={textFallback}
                onChange={(e) => setTextFallback(e.target.value)}
                placeholder="Type your request here (e.g., 'Laptop under ₹60,000')..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Analyze
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
