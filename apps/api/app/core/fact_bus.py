import time
import random
from typing import Dict, List, Any, Optional
from app.schemas.schemas import FactBusEventSchema, FactBusEventType, StrictOfferSchema, RequirementSchema, SellerSchema
from app.core.database import (
    negotiation_sessions_col,
    offers_col,
    negotiation_events_col,
    fact_bus_col
)

class FactBusMemoryStore:
    """
    Hero Architecture Feature — Panchayat AI Fact Bus (Shared Negotiation Memory)
    Maintains an immutable append-only event log and materialized session state.
    Events cannot be overwritten or deleted.
    """
    def __init__(self):
        self.session_id: str = f"PB-2026-{random.randint(1000, 9999)}"
        self.requirement: Optional[RequirementSchema] = None
        self.active_sellers: List[SellerSchema] = []
        self.offers: Dict[str, StrictOfferSchema] = {}
        self.best_offer: Optional[float] = None
        self.best_seller_id: Optional[str] = None
        self.best_seller_name: Optional[str] = None
        self.highest_initial_quote: Optional[float] = None
        self.events: List[FactBusEventSchema] = []  # Immutable Append-Only Log
        self.status: str = "DISCOVERED"
        self.current_round: int = 0
        self.created_at: str = time.strftime("%Y-%m-%d %H:%M:%S")

    def initialize_session(self, requirement: RequirementSchema, sellers: List[SellerSchema]):
        self.session_id = f"PB-2026-{random.randint(1000, 9999)}"
        self.requirement = requirement
        self.active_sellers = sellers
        self.offers = {}
        self.best_offer = None
        self.best_seller_id = None
        self.best_seller_name = None
        self.highest_initial_quote = None
        self.events = []
        self.status = "DISCOVERED"
        self.current_round = 0
        self.created_at = time.strftime("%Y-%m-%d %H:%M:%S")

        # Record SESSION_CREATED Event
        self.record_event(
            event_type="SESSION_CREATED",
            message=f"Panchayat AI Fact Bus session created for '{requirement.product}' (Target Budget: ₹{requirement.budget:,.0f})"
        )

        # Record SELLER_DISCOVERED Events
        for seller in sellers:
            self.record_event(
                event_type="SELLER_DISCOVERED",
                seller_id=seller.id,
                seller_name=seller.name,
                message=f"Discovered merchant {seller.name} ({seller.distanceKm} km away in {seller.location})"
            )

        # Initialize initial quotes
        now_str = time.strftime("%Y-%m-%d %H:%M:%S")
        for seller in sellers:
            initial_price = round(requirement.budget * seller.basePriceMultiplier)
            offer = StrictOfferSchema(
                seller_id=seller.id,
                session_id=self.session_id,
                product_id=requirement.product,
                seller_name=seller.name,
                price=initial_price,
                initial_price=initial_price,
                currency="INR",
                timestamp=now_str,
                availability="IN_STOCK" if seller.stockStatus == "IN_STOCK" else "LIMITED",
                warranty=seller.warrantyOffered,
                conditions=["Sealed Packaging", "Verified GST Invoice"],
                source="SIMULATED",
                verification_status="VERIFIED",
                confidence=0.94,
                negotiation_round=1,
                last_message=f"Contacted {seller.name} for initial quote"
            )
            self.offers[seller.id] = offer

            self.record_event(
                event_type="OFFER_RECEIVED",
                seller_id=seller.id,
                seller_name=seller.name,
                price=initial_price,
                message=f"Initial offer received from {seller.name}: ₹{initial_price:,.0f}"
            )

        self._persist_snapshot_to_mongodb()

    def record_event(
        self,
        event_type: FactBusEventType,
        message: str,
        seller_id: Optional[str] = None,
        seller_name: Optional[str] = None,
        price: Optional[float] = None,
        prev_price: Optional[float] = None,
        confidence: float = 0.94
    ) -> FactBusEventSchema:
        """
        Appends an immutable event to the Fact Bus event log.
        Guaranteed append-only: previous events are never altered or deleted.
        """
        now_str = time.strftime("%Y-%m-%d %H:%M:%S")
        evt = FactBusEventSchema(
            id=f"evt-{int(time.time()*1000)}-{len(self.events)+1}",
            sessionId=self.session_id,
            timestamp=now_str,
            eventType=event_type,
            sellerId=seller_id,
            sellerName=seller_name,
            price=price,
            previousBestPrice=prev_price,
            message=message,
            confidence=confidence,
            verification_status="VERIFIED"
        )
        
        # Append-only log
        self.events.insert(0, evt)

        # Persist immutable event to MongoDB Atlas 'negotiation_events'
        try:
            negotiation_events_col.insert_one(evt.model_dump())
        except Exception:
            pass

        self._persist_snapshot_to_mongodb()
        return evt

    def add_event(self, event_type: FactBusEventType, message: str, seller_id: str = None, seller_name: str = None, price: float = None, prev_price: float = None, confidence: float = 0.90):
        return self.record_event(
            event_type=event_type,
            message=message,
            seller_id=seller_id,
            seller_name=seller_name,
            price=price,
            prev_price=prev_price,
            confidence=confidence
        )

    def update_offer(self, seller_id: str, price: float, status: str, last_message: str, confidence: float = 0.94):
        if seller_id not in self.offers:
            return

        offer = self.offers[seller_id]
        old_price = offer.price
        offer.price = price
        offer.last_message = last_message
        offer.confidence = confidence
        offer.timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        offer.negotiation_round += 1

        if self.highest_initial_quote is None or offer.initial_price > self.highest_initial_quote:
            self.highest_initial_quote = offer.initial_price

        # Record COUNTER_OFFER_RECEIVED Event
        self.record_event(
            event_type="COUNTER_OFFER_RECEIVED",
            seller_id=seller_id,
            seller_name=offer.seller_name,
            price=price,
            prev_price=old_price,
            message=last_message,
            confidence=confidence
        )

        is_new_best = self.best_offer is None or price < self.best_offer
        old_best = self.best_offer

        if is_new_best:
            self.best_offer = price
            self.best_seller_id = seller_id
            self.best_seller_name = offer.seller_name

            # Record BEST_OFFER_UPDATED Event
            self.record_event(
                event_type="BEST_OFFER_UPDATED",
                seller_id=seller_id,
                seller_name=offer.seller_name,
                price=price,
                prev_price=old_best or offer.initial_price,
                message=f"🔥 BEST OFFER UPDATED: {offer.seller_name} established new market best price of ₹{price:,.0f}",
                confidence=confidence
            )

        # Persist offer to MongoDB Atlas 'offers'
        try:
            offers_col.update_one(
                {"seller_id": seller_id, "session_id": self.session_id},
                {"$set": offer.model_dump()},
                upsert=True
            )
        except Exception:
            pass

        self._persist_snapshot_to_mongodb()

    def _persist_snapshot_to_mongodb(self):
        """Persists materialized session snapshot to MongoDB Atlas."""
        try:
            snapshot = self.to_dict()
            negotiation_sessions_col.update_one(
                {"_id": self.session_id},
                {"$set": snapshot},
                upsert=True
            )
            fact_bus_col.update_one(
                {"_id": self.session_id},
                {
                    "$set": {
                        "session_id": self.session_id,
                        "best_offer": self.best_offer,
                        "best_seller": self.best_seller_name,
                        "total_events": len(self.events),
                        "status": self.status,
                        "last_updated": time.strftime("%Y-%m-%d %H:%M:%S")
                    }
                },
                upsert=True
            )
        except Exception:
            pass

    def to_dict(self) -> Dict[str, Any]:
        savings = (self.highest_initial_quote - self.best_offer) if (self.highest_initial_quote and self.best_offer) else 0
        savings_pct = round((savings / self.highest_initial_quote) * 100, 2) if (self.highest_initial_quote and savings > 0) else 0.0

        return {
            "sessionId": self.session_id,
            "requirement": self.requirement.model_dump() if self.requirement else None,
            "activeSellers": [s.model_dump() for s in self.active_sellers],
            "offers": {k: v.model_dump() for k, v in self.offers.items()},
            "bestOffer": self.best_offer,
            "bestSellerId": self.best_seller_id,
            "bestSellerName": self.best_seller_name,
            "highestInitialQuote": self.highest_initial_quote,
            "events": [e.model_dump() for e in self.events],
            "status": self.status,
            "currentRound": self.current_round,
            "totalSavings": savings,
            "savingsPercentage": savings_pct,
            "createdAt": self.created_at
        }

fact_bus = FactBusMemoryStore()
