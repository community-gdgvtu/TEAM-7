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
import type { Language, NegotiationSession, Requirement } from './types';
import { factBus } from './services/factBusStore';
import { discoverLocalSellers } from './services/discoveryAgent';
import { negotiationEngine } from './services/negotiationEngine';

export function App() {
  const [activeTab, setActiveTab] = useState<'customer' | 'negotiation' | 'results' | 'seller' | 'admin' | 'command_center'>('customer');
  const [language, setLanguage] = useState<Language>('en');
  const [session, setSession] = useState<NegotiationSession>(factBus.getSession());
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = factBus.subscribe((updatedSession) => {
      setSession(updatedSession);
    });
    return () => unsubscribe();
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
    setActiveTab('customer');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 flex flex-col">
      
      {/* Global Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        isNegotiating={session.status === 'NEGOTIATING'}
        bestOffer={session.bestOffer}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {activeTab === 'customer' && (
          <CustomerDashboard
            language={language}
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            onStartNegotiation={handleStartNegotiation}
          />
        )}

        {activeTab === 'negotiation' && (
          <LiveNegotiation
            session={session}
            onNegotiationComplete={handleNegotiationComplete}
          />
        )}

        {activeTab === 'results' && (
          <ResultsScreen
            session={session}
            onRestart={handleRestart}
          />
        )}

        {activeTab === 'seller' && (
          <SellerPortal session={session} />
        )}

        {activeTab === 'command_center' && (
          <CommandCenter session={session} />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard />
        )}
      </main>

      {/* Modals */}
      <VoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        language={language}
        onVoiceRequirementReady={(req) => {
          setIsVoiceModalOpen(false);
          handleStartNegotiation(req);
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

    </div>
  );
}

export default App;
