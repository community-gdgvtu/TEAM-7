import { factBus } from './factBusStore';
import type { Offer, Requirement, Seller } from '../types';

export interface NegotiationStepResult {
  sellerId: string;
  sellerName: string;
  price: number;
  message: string;
  aiStrategy: string;
  status: Offer['status'];
  round: number;
  confidence: number;
}

/**
 * Agent 3 & 4 — Negotiation Agent & Offer Verification Engine
 * Executes state-machine driven multi-round competitive negotiation.
 */
export class NegotiationEngine {
  private requirement: Requirement | null = null;
  private sellers: Seller[] = [];
  private stepIndex: number = 0;
  private isRunning: boolean = false;
  private timerId: any = null;

  public async startNegotiation(
    requirement: Requirement,
    sellers: Seller[],
    onUpdate?: () => void
  ) {
    this.requirement = requirement;
    this.sellers = sellers;
    this.stepIndex = 0;
    this.isRunning = true;

    // 1. Initialize Fact Bus shared memory session
    factBus.initializeSession(requirement, sellers);
    factBus.setStatus('NEGOTIATING');

    // 2. Log initial seller contact events
    for (const seller of sellers) {
      factBus.addEvent({
        eventType: 'SELLER_CONTACTED',
        sellerId: seller.id,
        sellerName: seller.name,
        message: `Panchayat AI dispatched RFQ to ${seller.name} (${seller.distanceKm} km away)`
      });
    }

    if (onUpdate) onUpdate();
  }

  /**
   * Advances the negotiation simulation by one step across active sellers.
   */
  public advanceStep(): boolean {
    if (!this.requirement || this.sellers.length === 0) return false;

    const session = factBus.getSession();
    const round = Math.floor(this.stepIndex / this.sellers.length) + 1;
    const seller = this.sellers[this.stepIndex % this.sellers.length];
    const currentOffer = session.offers[seller.id];

    if (!currentOffer) return false;

    // Calculate maximum discount floor for this seller based on flexibility
    const targetBudget = this.requirement.budget;
    const minPriceFloor = Math.round(targetBudget * (1 - seller.flexibility / 100));

    let newPrice = currentOffer.price;
    let status: Offer['status'] = 'negotiating';
    let message = '';
    let confidence = 88;

    if (round === 1) {
      // Round 1: Initial Quote
      newPrice = Math.round(targetBudget * seller.basePriceMultiplier);
      status = 'initial_offer';
      message = `Quoted initial price of ₹${newPrice.toLocaleString('en-IN')}`;
      confidence = 94;

      factBus.addEvent({
        eventType: 'INITIAL_OFFER',
        sellerId: seller.id,
        sellerName: seller.name,
        price: newPrice,
        message: `${seller.name} quoted initial price: ₹${newPrice.toLocaleString('en-IN')}`
      });
    } else if (round === 2) {
      // Round 2: Counter with Customer Budget
      status = 'counter_offer';
      const dropAmount = Math.round((currentOffer.price - targetBudget) * 0.4);
      newPrice = Math.max(minPriceFloor, currentOffer.price - dropAmount);
      message = `Panchayat AI requested budget match. ${seller.name} dropped price to ₹${newPrice.toLocaleString('en-IN')}`;
      confidence = 90;

      factBus.addEvent({
        eventType: 'COUNTER_OFFER',
        sellerId: seller.id,
        sellerName: seller.name,
        price: newPrice,
        message: `Panchayat AI counter-offered. ${seller.name} lowered to ₹${newPrice.toLocaleString('en-IN')}`
      });
    } else if (round === 3) {
      // Round 3: HERO FEATURE — Leverage Fact Bus Shared Memory!
      const currentBest = session.bestOffer;
      if (currentBest && currentBest < currentOffer.price) {
        // Seller attempts to beat or match the current benchmark
        const benchmarkDrop = Math.round((currentOffer.price - currentBest) * 0.85);
        newPrice = Math.max(minPriceFloor, currentOffer.price - benchmarkDrop);
        
        if (newPrice < currentBest) {
          message = `Panchayat AI: "Another verified local seller offered ₹${currentBest.toLocaleString('en-IN')}. Can you improve that?" → ${seller.name}: "We can do ₹${newPrice.toLocaleString('en-IN')}"`;
        } else {
          newPrice = Math.max(minPriceFloor, currentBest);
          message = `${seller.name} matched best market benchmark at ₹${newPrice.toLocaleString('en-IN')}`;
        }
        status = 'negotiating';
        confidence = 93;

        factBus.addEvent({
          eventType: 'BENCHMARK_LEVERAGED',
          sellerId: seller.id,
          sellerName: seller.name,
          price: newPrice,
          previousBestPrice: currentBest,
          message: `Panchayat AI leveraged Fact Bus benchmark ₹${currentBest.toLocaleString('en-IN')}. ${seller.name} revised offer to ₹${newPrice.toLocaleString('en-IN')}`
        });
      } else {
        // If this seller is already the best, push for final discount
        newPrice = Math.max(minPriceFloor, Math.round(currentOffer.price * 0.98));
        message = `${seller.name} further discounted leading offer to ₹${newPrice.toLocaleString('en-IN')}`;
        confidence = 95;
      }
    } else if (round >= 4) {
      // Round 4: Final Offer & Verification
      status = 'verified';
      newPrice = Math.max(minPriceFloor, currentOffer.price);
      message = `Final offer locked at ₹${newPrice.toLocaleString('en-IN')}. Offer verified with ${seller.warrantyOffered}.`;
      confidence = 96;

      factBus.addEvent({
        eventType: 'OFFER_VERIFIED',
        sellerId: seller.id,
        sellerName: seller.name,
        price: newPrice,
        confidence: 96,
        message: `✅ OFFER VERIFIED: ${seller.name} locked final offer at ₹${newPrice.toLocaleString('en-IN')} (Confidence: 96%)`
      });
    }

    // Update Fact Bus memory with new offer
    factBus.updateOffer(
      seller.id,
      newPrice,
      status,
      message,
      confidence,
      seller.warrantyOffered
    );

    this.stepIndex += 1;

    // If all sellers have completed 4 rounds, mark negotiation complete
    if (this.stepIndex >= this.sellers.length * 4) {
      this.isRunning = false;
      factBus.setStatus('COMPLETED');
      factBus.addEvent({
        eventType: 'OFFER_VERIFIED',
        message: '🏁 Negotiation cycle completed across all local sellers. Generating intelligence recommendations...'
      });
      return false; // Done
    }

    return true; // More steps remaining
  }

  /**
   * Runs the full negotiation automatically with step delay (or fast forward).
   */
  public runAutoSimulation(onStep?: () => void, delayMs: number = 1800) {
    this.stopAutoSimulation();
    
    const loop = () => {
      const hasMore = this.advanceStep();
      if (onStep) onStep();

      if (hasMore && this.isRunning) {
        this.timerId = setTimeout(loop, delayMs);
      }
    };

    this.timerId = setTimeout(loop, 400);
  }

  public stopAutoSimulation() {
    this.isRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Instant fast-forward completion for quick testing/demo.
   */
  public fastForwardAll() {
    this.stopAutoSimulation();
    while (this.advanceStep()) {
      // Loop until finished
    }
  }
}

export const negotiationEngine = new NegotiationEngine();
