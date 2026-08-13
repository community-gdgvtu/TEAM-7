from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Literal
from enum import Enum

class NegotiationStateEnum(str, Enum):
    DISCOVERED = "DISCOVERED"
    CONTACTED = "CONTACTED"
    INITIAL_OFFER = "INITIAL_OFFER"
    NEGOTIATING = "NEGOTIATING"
    COUNTER_OFFER = "COUNTER_OFFER"
    FINAL_OFFER = "FINAL_OFFER"
    VERIFICATION = "VERIFICATION"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    EXPIRED = "EXPIRED"

UserRoleType = Literal['CUSTOMER', 'SELLER', 'ADMIN']
OfferSourceType = Literal['SIMULATED', 'MANUAL_SELLER', 'VOICE_ADAPTER']

class UserSchema(BaseModel):
    id: str
    email: str
    name: str
    role: UserRoleType = "CUSTOMER"

class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRoleType

class RequirementSchema(BaseModel):
    product: str
    category: str = "Electronics"
    brand_preference: Optional[str] = "Any Brand"
    quantity: str = "1 Unit"
    budget: float = Field(ge=0.0, description="Customer maximum target budget in INR")
    currency: str = "INR"
    purpose: Optional[str] = "Personal Use"
    location: str = "Hulkoti Market, Gadag"
    required_features: List[str] = []
    preferred_seller_distance_km: float = 5.0
    warranty_preference: Optional[str] = "1 Year Brand Warranty"
    urgency: str = "STANDARD"
    language: str = "en"
    originalPrompt: str = ""
    confidence: float = Field(default=0.95, ge=0.0, le=1.0)
    needs_clarification: bool = False
    clarification_prompt: Optional[str] = None
    human_interpretation: str = ""

class SellerSchema(BaseModel):
    id: str
    name: str
    category: str
    location: str
    address: str
    distanceKm: float
    rating: float
    verificationStatus: Literal['VERIFIED', 'PREMIUM', 'PENDING']
    responseRate: int
    tenureYears: int
    dealsCompleted: int
    basePriceMultiplier: float
    flexibility: float
    warrantyOffered: str
    stockStatus: Literal['IN_STOCK', 'LIMITED', 'ORDER_BASED']
    deliveryOffered: bool
    phone: str
    latitude: Optional[float] = 15.4328
    longitude: Optional[float] = 75.6318

class DiscoveredSellerSchema(BaseModel):
    seller: SellerSchema
    match_score: float = Field(ge=0.0, le=100.0, description="Deterministic match score 0-100")
    distance_km: float
    available_product: str
    estimated_price_range: str
    reliability_score: float = Field(ge=0.0, le=100.0)
    explanation: str

class DiscoverySearchResponseSchema(BaseModel):
    total_found: int
    sellers: List[DiscoveredSellerSchema]
    category_filter: str
    location_filter: str
    page: int
    limit: int

class StrictOfferSchema(BaseModel):
    seller_id: str
    session_id: str
    product_id: str
    seller_name: str
    price: float
    currency: str = "INR"
    timestamp: str
    availability: str
    warranty: str
    conditions: List[str] = []
    source: OfferSourceType = "SIMULATED"
    verification_status: Literal['VERIFIED', 'PENDING', 'REJECTED'] = "VERIFIED"
    confidence: float = Field(default=0.94, ge=0.0, le=1.0)
    negotiation_round: int = 1
    last_message: str = ""
    initial_price: float = 0.0

class ExtractedOfferSchema(BaseModel):
    product: Optional[str] = None
    price: Optional[float] = None
    currency: str = "INR"
    quantity: Optional[str] = None
    warranty: Optional[str] = None
    availability: Optional[str] = None
    delivery: Optional[str] = None
    conditions: List[str] = []
    validity: Optional[str] = None
    seller_intent: str = "COUNTER_OFFER"
    confidence: float = Field(default=0.92, ge=0.0, le=1.0)
    raw_message: Optional[str] = None
    original_seller_message: Optional[str] = None
    has_ambiguous_price: bool = False

FactBusEventType = Literal[
    'SESSION_CREATED',
    'SELLER_DISCOVERED',
    'SELLER_CONTACTED',
    'OFFER_RECEIVED',
    'COUNTER_OFFER_SENT',
    'COUNTER_OFFER_RECEIVED',
    'BEST_OFFER_UPDATED',
    'BENCHMARK_LEVERAGED',
    'SELLER_CONFIRMED',
    'OFFER_VERIFIED',
    'FINAL_OFFER',
    'NEGOTIATION_COMPLETED',
    'NEGOTIATION_FAILED'
]

class FactBusEventSchema(BaseModel):
    id: str
    sessionId: str
    timestamp: str
    eventType: FactBusEventType
    sellerId: Optional[str] = None
    sellerName: Optional[str] = None
    price: Optional[float] = None
    previousBestPrice: Optional[float] = None
    message: str
    confidence: float = Field(default=0.94, ge=0.0, le=1.0)
    verification_status: str = "VERIFIED"

class ComponentScoresSchema(BaseModel):
    price_score: float = Field(ge=0.0, le=100.0)
    reliability_score: float = Field(ge=0.0, le=100.0)
    distance_score: float = Field(ge=0.0, le=100.0)
    warranty_score: float = Field(ge=0.0, le=100.0)
    availability_score: float = Field(ge=0.0, le=100.0)
    confidence_score: float = Field(ge=0.0, le=100.0)

class DealScoreSchema(BaseModel):
    seller_id: str
    seller_name: str
    price: float
    distance_km: float
    rating: float
    warranty: str
    availability: str
    total_score: float = Field(ge=0.0, le=100.0)
    component_scores: ComponentScoresSchema
    is_recommended: bool = False
    explanation: str
    trade_offs: List[str] = []

class DealRecommendationResponseSchema(BaseModel):
    session_id: str
    recommended_deal: Optional[DealScoreSchema] = None
    ranked_offers: List[DealScoreSchema]
    best_discovered_price: Optional[float] = None
    highest_initial_quote: Optional[float] = None
    total_savings: float = 0.0
    savings_percentage: float = 0.0
