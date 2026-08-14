import { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { CustomerDashboard } from './components/CustomerDashboard';
import { LiveNegotiation } from './components/LiveNegotiation';
import { ResultsScreen } from './components/ResultsScreen';
import { SellerPortal } from './components/SellerPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { CommandCenter } from './components/CommandCenter';
import { VoiceModal } from './components/VoiceModal';
import { AuthModal } from './components/AuthModal';
import { AuthLandingPage } from './components/AuthLandingPage';
import { LocationPickerModal } from './components/LocationPickerModal';
import type { Language, NegotiationSession, Requirement } from './types';
import { factBus } from './services/factBusStore';
import { discoverLocalSellers } from './services/discoveryAgent';
import { negotiationEngine } from './services/negotiationEngine';
import { usePermission, TabId } from './hooks/usePermission';

export function App() {
  const { user, defaultTab, canAccessTab } = usePermission();
  const [activeTab, setActiveTab] = useState<TabId>('customer');
  const [language, setLanguage] = useState<Language>('en');
  const [session, setSession] = useState<NegotiationSession>(factBus.getSession());
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Sync activeTab with role default when user changes (login/logout/switch role)
  useEffect(() => {
    if (user) {
      setActiveTab(defaultTab);
    }
  }, [user?.id, user?.role, defaultTab]);

  // Route Guard: Prevent access to unpermitted tabs for current role
  useEffect(() => {
    if (user && !canAccessTab(activeTab)) {
      setActiveTab(defaultTab);
    }
  }, [user, activeTab, defaultTab, canAccessTab]);

  useEffect(() => {
    const unsubFactBus = factBus.subscribe((updatedSession) => {
      setSession(updatedSession);
    });
    return () => {
      unsubFactBus();
    };
  }, []);

  const handleStartNegotiation = (req: Requirement) => {
    const matchedSellers = discoverLocalSellers(req);

    negotiationEngine.startNegotiation(req, matchedSellers, () => {
      setSession(factBus.getSession());
    });

    setActiveTab('negotiation');
    negotiationEngine.runAutoSimulation(() => {
      const current = factBus.getSession();
      if (current.status === 'COMPLETED') {
        setActiveTab('results');
      }
    }, 1600);
  };

  const handleNegotiationComplete = () => {
    setActiveTab('results');
  };

  const handleRestart = () => {
    setActiveTab(defaultTab);
  };

  // Mandatory Authentication Gate: Render AuthLandingPage first if unauthenticated
  if (!user) {
    return <AuthLandingPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 flex flex-col">
      
      {/* Global Header — Filtered by Role */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        isNegotiating={session.status === 'NEGOTIATING'}
        bestOffer={session.bestOffer}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenLocationPicker={() => setIsLocationModalOpen(true)}
      />

      {/* Main View Router — Guarded by RBAC */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 pb-16">
        {activeTab === 'customer' && canAccessTab('customer') && (
          <CustomerDashboard
            language={language}
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            onStartNegotiation={handleStartNegotiation}
          />
        )}

        {activeTab === 'negotiation' && canAccessTab('negotiation') && (
          <LiveNegotiation
            session={session}
            onNegotiationComplete={handleNegotiationComplete}
            onOpenLocationPicker={() => setIsLocationModalOpen(true)}
          />
        )}

        {activeTab === 'results' && canAccessTab('results') && (
          <ResultsScreen
            session={session}
            onRestart={handleRestart}
          />
        )}

        {activeTab === 'seller' && canAccessTab('seller') && (
          <SellerPortal session={session} />
        )}

        {activeTab === 'command_center' && canAccessTab('command_center') && (
          <CommandCenter session={session} />
        )}

        {activeTab === 'admin' && canAccessTab('admin') && (
          <AdminDashboard session={session} />
        )}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">PANCHAYAT AI</span> — Shared Negotiation Memory Protocol
          </div>
          <p className="text-[11px] text-slate-500">
            Powered by 5-Agent Architecture & Deterministic Business Rules Engine
          </p>
        </div>
      </footer>

      {/* Voice Input Modal */}
      <VoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        language={language}
        onConfirmRequirement={handleStartNegotiation}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Location Picker & Permission Modal */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />

    </div>
  );
}

export default App;
