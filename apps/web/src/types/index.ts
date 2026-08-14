export type Language = 'en' | 'hi' | 'kn' | 'ur' | 'ja';

export type ProductCategory = 'Electronics' | 'Groceries' | 'Clothing' | 'Hardware' | 'Computers';

export type NegotiationMode = 'AGGRESSIVE' | 'BALANCED' | 'EXPRESS';

export type UserRole = 'CUSTOMER' | 'SELLER' | 'ADMIN';

export type NegotiationState = 
  | 'DISCOVERED'
  | 'CONTACTED'
  | 'INITIAL_OFFER'
  | 'NEGOTIATING'
  | 'COUNTER_OFFER'
  | 'FINAL_OFFER'
  | 'VERIFICATION'
  | 'COMPLETED'
  | 'FAILED'
  | 'EXPIRED';

export type OfferSource = 'SIMULATED' | 'MANUAL_SELLER' | 'VOICE_ADAPTER';

export interface Requirement {
  product: string;
  brand?: string;
  category: ProductCategory;
  quantity: string;
  budget: number;
  location: string;
  preferences: string[];
  originalPrompt: string;
  language: Language;
  strategyMode?: NegotiationMode;
  confidence?: number;
  purpose?: string;
  warranty_preference?: string;
  human_interpretation?: string;
}

export interface Seller {
  id: string;
  name: string;
  category: ProductCategory;
  location: string;
  address: string;
  distanceKm: number;
  rating: number;
  verificationStatus: 'VERIFIED' | 'PREMIUM' | 'PENDING';
  responseRate: number;
  tenureYears: number;
  dealsCompleted: number;
  basePriceMultiplier: number;
  flexibility: number;
  warrantyOffered: string;
  stockStatus: 'IN_STOCK' | 'LIMITED' | 'ORDER_BASED';
  deliveryOffered: boolean;
  phone: string;
  avatarUrl?: string;
  latitude?: number;
  longitude?: number;
}

export interface StrictOffer {
  id?: string;
  seller_id?: string;
  session_id?: string;
  product_id?: string;
  seller_name?: string;
  price: number;
  currency?: string;
  timestamp?: string;
  availability?: string;
  warranty?: string;
  conditions?: string[];
  source?: OfferSource;
  verification_status?: 'VERIFIED' | 'PENDING' | 'REJECTED';
  confidence?: number;
  negotiation_round?: number;
  last_message?: string;
  initial_price?: number;

  // Frontend Aliases
  sessionId?: string;
  sellerId?: string;
  sellerName?: string;
  initialPrice?: number;
  lastMessage?: string;
  sellerRating?: number;
  sellerDistance?: number;
  status?: string;
  evidence?: string;
  roundCount?: number;
  condition?: string;
  deliveryAvailable?: boolean;
}

export type Offer = StrictOffer;

export interface FactBusEvent {
  id: string;
  sessionId: string;
  timestamp: string;
  sellerId?: string;
  sellerName?: string;
  eventType: 
    | 'SESSION_START' 
    | 'SELLER_CONTACTED' 
    | 'INITIAL_OFFER' 
    | 'BEST_OFFER_UPDATED' 
    | 'BENCHMARK_LEVERAGED' 
    | 'COUNTER_OFFER' 
    | 'FINAL_OFFER' 
    | 'OFFER_VERIFIED';
  price?: number;
  previousBestPrice?: number;
  message: string;
  confidence?: number;
}

export interface NegotiationSession {
  sessionId: string;
  requirement: Requirement;
  activeSellers: Seller[];
  offers: Record<string, StrictOffer>;
  bestOffer: number | null;
  bestSellerId: string | null;
  bestSellerName: string | null;
  highestInitialQuote: number | null;
  events: FactBusEvent[];
  status: NegotiationState | string;
  currentRound: number;
  totalSavings: number;
  savingsPercentage: number;
  createdAt?: string;
}

export interface DealScore {
  sellerId: string;
  sellerName: string;
  price: number;
  distanceKm: number;
  rating: number;
  warranty: string;
  totalScore: number;
  priceScore: number;
  reliabilityScore: number;
  distanceScore: number;
  warrantyScore: number;
  deliveryScore: number;
  isRecommended: boolean;
  rationale: string;
  trade_offs?: string[];
}
