/**
 * SellerOnboardingModal — Authorized Seller Invitation, Claim & OTP Verification Modal
 * Enforces the strict governance rule: Google Places discovery does NOT imply consent.
 * Provides seller invitation, ownership claim, and OTP verification flows.
 */

import React, { useState } from 'react';
import {
  X,
  Store,
  ShieldAlert,
  Send,
  UserCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Building,
  Mail,
  Phone,
} from 'lucide-react';
import { sellerOnboardingApi } from '../services/apiClient';

interface SellerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  placeId: string;
  placeName: string;
  onVerificationComplete?: () => void;
}

export const SellerOnboardingModal: React.FC<SellerOnboardingModalProps> = ({
  isOpen,
  onClose,
  placeId,
  placeName,
  onVerificationComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'invite' | 'claim'>('invite');

  // Invite state
  const [contactInput, setContactInput] = useState('');
  const [inviteResult, setInviteResult] = useState<{ invite_id: string; message: string } | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Claim & Verification state
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [claimId, setClaimId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [claimStep, setClaimStep] = useState<'FILL_DETAILS' | 'ENTER_OTP' | 'VERIFIED'>('FILL_DETAILS');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactInput.trim()) return;
    setIsInviting(true);
    setErrorMsg('');
    try {
      const res = await sellerOnboardingApi.inviteSeller({
        place_id: placeId,
        place_name: placeName,
        contact_phone_or_email: contactInput.trim(),
        invited_by_customer_id: 'Customer-CurrentSession',
      });
      setInviteResult(res);
    } catch (err) {
      setErrorMsg(`Failed to send invitation: ${err instanceof Error ? err.message : 'API Error'}`);
    } finally {
      setIsInviting(false);
    }
  };

  const handleClaimAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName || !ownerPhone || !ownerEmail) return;
    setIsClaiming(true);
    setErrorMsg('');
    try {
      const res = await sellerOnboardingApi.claimAccount({
        place_id: placeId,
        seller_name: placeName,
        owner_name: ownerName,
        owner_phone: ownerPhone,
        owner_email: ownerEmail,
      });
      setClaimId(res.claim_id);
      setClaimStep('ENTER_OTP');
      setSuccessMsg(res.message);
    } catch (err) {
      setErrorMsg(`Failed to claim account: ${err instanceof Error ? err.message : 'API Error'}`);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;
    setIsVerifying(true);
    setErrorMsg('');
    try {
      const res = await sellerOnboardingApi.verifyClaim({
        claim_id: claimId,
        verification_code: otpCode.trim(),
      });
      setClaimStep('VERIFIED');
      setSuccessMsg(res.message);
      if (onVerificationComplete) {
        onVerificationComplete();
      }
    } catch (err) {
      setErrorMsg(`Verification failed: ${err instanceof Error ? err.message : 'Invalid code'}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const copyInviteLink = () => {
    const link = `https://panchayat-ai.org/seller/onboard?invite=${inviteResult?.invite_id || 'demo'}&place=${encodeURIComponent(placeId)}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Store className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Seller Connection Required</h2>
              <p className="text-xs text-slate-400 truncate max-w-[280px]">{placeName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Governance Warning Banner */}
        <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-200 space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-amber-400">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Seller Not Yet Connected</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Public Google Places listings are not automatically authorized Panchayat AI sellers. Automated bargaining requires explicit merchant opt-in and verified control.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/50">
          <button
            onClick={() => setActiveTab('invite')}
            className={`flex-1 py-2.5 px-4 text-xs font-bold transition border-b-2 ${
              activeTab === 'invite'
                ? 'border-amber-500 text-amber-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Send Merchant Invitation
          </button>
          <button
            onClick={() => setActiveTab('claim')}
            className={`flex-1 py-2.5 px-4 text-xs font-bold transition border-b-2 ${
              activeTab === 'claim'
                ? 'border-amber-500 text-amber-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Claim & Verify Ownership
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: Send Merchant Invitation */}
          {activeTab === 'invite' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Send an official invitation link to <strong className="text-white">{placeName}</strong> to onboard them onto Panchayat AI.
              </p>

              {!inviteResult ? (
                <form onSubmit={handleSendInvite} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Merchant Phone or Email Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98450 99999 or suresh@store.com"
                      value={contactInput}
                      onChange={(e) => setContactInput(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isInviting || !contactInput.trim()}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isInviting ? 'Generating Invitation...' : 'Send Authorized Invitation'}</span>
                  </button>
                </form>
              ) : (
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Invitation Successfully Generated!</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{inviteResult.message}</p>
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={copyInviteLink}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-slate-200 transition"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied Link!' : 'Copy Invitation Link'}</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('claim')}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs font-bold text-slate-950 transition"
                    >
                      <span>Claim Account Now</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Claim & Verify Ownership */}
          {activeTab === 'claim' && (
            <div className="space-y-4">

              {claimStep === 'FILL_DETAILS' && (
                <form onSubmit={handleClaimAccount} className="space-y-3">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Verify business ownership to complete onboarding for <strong className="text-white">{placeName}</strong>.
                  </p>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Business Owner Name
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="e.g. Suresh Patil"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        required
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Owner Mobile Phone
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="tel"
                        placeholder="e.g. +91 98450 99999"
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value)}
                        required
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Owner Business Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="email"
                        placeholder="e.g. suresh@store.com"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        required
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isClaiming}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{isClaiming ? 'Initiating Claim...' : 'Claim Business Account'}</span>
                  </button>
                </form>
              )}

              {claimStep === 'ENTER_OTP' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                    {successMsg || 'Verification code dispatched to owner phone.'}
                    <div className="mt-1 font-mono font-bold text-amber-400">Demo Verification Code: 654321</div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Enter 6-Digit OTP Code
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        placeholder="654321"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-base font-mono font-bold text-amber-400 tracking-widest focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifying || otpCode.length < 6}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isVerifying ? 'Verifying Ownership...' : 'Verify Ownership Code'}</span>
                  </button>
                </form>
              )}

              {claimStep === 'VERIFIED' && (
                <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h3 className="text-sm font-bold text-white">Business Account Connected!</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Business control verified. Merchant status is now <strong className="text-emerald-400">CONNECTED</strong>. Next step: Configure minimum pricing & enable AI bargaining in Seller Portal.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-2 py-2 px-6 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs transition"
                  >
                    Done & Close
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
