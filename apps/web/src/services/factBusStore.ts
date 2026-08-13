import type { FactBusEvent, NegotiationSession, Offer, Requirement, Seller } from '../types';

type Listener = (session: NegotiationSession) => void;

/**
 * Hero Feature — Fact Bus (Shared Negotiation Memory)
 * Holds state and event stream across all concurrent seller negotiations.
 */
export class FactBusStore {
  private session: NegotiationSession;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.session = this.createInitialSession();
  }

  private createInitialSession(): NegotiationSession {
    return {
      sessionId: `PB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      requirement: {
        product: 'Coding Laptop (16GB RAM)',
        category: 'Computers',
        quantity: '1 Unit',
        budget: 60000,
        location: 'Hulkoti Market, Gadag',
        preferences: ['16GB RAM', '1 Year Warranty'],
        originalPrompt: 'I need a laptop for coding under ₹60,000.',
        language: 'en'
      },
      activeSellers: [],
      offers: {},
      bestOffer: null,
      bestSellerId: null,
      bestSellerName: null,
      highestInitialQuote: null,
      events: [],
      status: 'IDLE',
      currentRound: 0,
      totalSavings: 0,
      savingsPercentage: 0
    };
  }

  public getSession(): NegotiationSession {
    return { ...this.session };
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener({ ...this.session }));
  }

  public initializeSession(requirement: Requirement, sellers: Seller[]) {
    const sessionId = `PB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toLocaleTimeString();

    const startEvent: FactBusEvent = {
      id: `evt-${Date.now()}-0`,
      sessionId,
      timestamp: now,
      eventType: 'SESSION_START',
      message: `Panchayat AI initialized discovery session for "${requirement.product}" (Budget: ₹${requirement.budget.toLocaleString('en-IN')})`
    };

    const initialOffers: Record<string, Offer> = {};
    sellers.forEach((seller) => {
      // Calculate initial seller price (higher than target budget to leave room for negotiation)
      const initialPrice = Math.round(requirement.budget * seller.basePriceMultiplier);
      initialOffers[seller.id] = {
        id: `off-${seller.id}`,
        sessionId,
        sellerId: seller.id,
        sellerName: seller.name,
        sellerDistance: seller.distanceKm,
        sellerRating: seller.rating,
        price: initialPrice,
        initialPrice,
        condition: 'Brand New Sealed Pack',
        warranty: seller.warrantyOffered,
        deliveryAvailable: seller.deliveryOffered,
        availability: seller.stockStatus === 'IN_STOCK' ? 'Ready in stock' : 'Available on order',
        timestamp: now,
        confidence: 85,
        status: 'contacted',
        lastMessage: `Contacted ${seller.name}...`,
        roundCount: 0,
        evidence: `Verified Merchant Quote Log #${seller.id.slice(-4)}`
      };
    });

    this.session = {
      sessionId,
      requirement,
      activeSellers: sellers,
      offers: initialOffers,
      bestOffer: null,
      bestSellerId: null,
      bestSellerName: null,
      highestInitialQuote: null,
      events: [startEvent],
      status: 'SEARCHING',
      currentRound: 0,
      totalSavings: 0,
      savingsPercentage: 0
    };

    this.notify();
  }

  public setStatus(status: NegotiationSession['status']) {
    this.session.status = status;
    this.notify();
  }

  public addEvent(event: Omit<FactBusEvent, 'id' | 'sessionId' | 'timestamp'>): FactBusEvent {
    const fullEvent: FactBusEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sessionId: this.session.sessionId,
      timestamp: new Date().toLocaleTimeString()
    };

    this.session.events.unshift(fullEvent); // newest first for live feed
    this.notify();
    return fullEvent;
  }

  public updateOffer(
    sellerId: string, 
    price: number, 
    status: Offer['status'], 
    lastMessage: string, 
    confidence: number = 90,
    warranty?: string
  ) {
    const offer = this.session.offers[sellerId];
    if (!offer) return;

    offer.price = price;
    offer.status = status;
    offer.lastMessage = lastMessage;
    offer.confidence = confidence;
    offer.timestamp = new Date().toLocaleTimeString();
    if (warranty) offer.warranty = warranty;
    offer.roundCount = (offer.roundCount || 1) + 1;

    const initP = offer.initialPrice || offer.initial_price || offer.price;

    // Track highest initial quote
    if (this.session.highestInitialQuote === null || initP > this.session.highestInitialQuote) {
      this.session.highestInitialQuote = initP;
    }

    // Check if this offer breaks the current Fact Bus benchmark!
    const isNewBest = this.session.bestOffer === null || price < this.session.bestOffer;
    const oldBest = this.session.bestOffer;
    const sName = offer.sellerName || offer.seller_name || 'Merchant';

    if (isNewBest) {
      this.session.bestOffer = price;
      this.session.bestSellerId = sellerId;
      this.session.bestSellerName = sName;

      // Broadcast BEST_OFFER_UPDATED event to Fact Bus!
      this.addEvent({
        eventType: 'BEST_OFFER_UPDATED',
        sellerId,
        sellerName: sName,
        price,
        previousBestPrice: oldBest ?? initP,
        message: `🔥 FACT BUS MEMORY UPDATE: New best offer discovered from ${sName} at ₹${price.toLocaleString('en-IN')}`,
        confidence
      });
    }

    // Calculate dynamic savings metrics
    if (this.session.highestInitialQuote && this.session.bestOffer) {
      this.session.totalSavings = this.session.highestInitialQuote - this.session.bestOffer;
      this.session.savingsPercentage = parseFloat(
        ((this.session.totalSavings / this.session.highestInitialQuote) * 100).toFixed(2)
      );
    }

    this.notify();
  }
}

// Global Singleton Instance for Fact Bus
export const factBus = new FactBusStore();
