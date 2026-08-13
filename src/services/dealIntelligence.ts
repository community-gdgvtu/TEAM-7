import type { DealScore, NegotiationSession, Seller } from '../types';

/**
 * Agent 5 — Deal Intelligence & Ranking Agent
 * Calculates multi-factor Deal Score taking into account Price, Reliability, Distance,
 * Warranty, Stock & Delivery instead of blindly recommending raw lowest price.
 */
export function calculateDealIntelligence(session: NegotiationSession): DealScore[] {
  const offersList = Object.values(session.offers);
  if (offersList.length === 0) return [];

  // Find price range among offers
  const prices = offersList.map((o) => o.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const targetBudget = session.requirement.budget;

  const dealScores: DealScore[] = offersList.map((offer) => {
    const sId = offer.sellerId || offer.seller_id || 'unknown';
    const sName = offer.sellerName || offer.seller_name || 'Local Merchant';
    const sWarranty = offer.warranty || 'Standard Warranty';
    const sRating = offer.sellerRating || 4.5;
    const sDistance = offer.sellerDistance || 1.5;

    const seller = session.activeSellers.find((s) => s.id === sId) || {
      id: sId,
      name: sName,
      rating: sRating,
      distanceKm: sDistance,
      verificationStatus: 'VERIFIED',
      responseRate: 94,
      dealsCompleted: 200,
      warrantyOffered: sWarranty,
      deliveryOffered: true
    } as Seller;

    // 1. Price Score (40% weight): Lower price relative to target budget gives higher score
    let priceScore = 0;
    if (maxPrice === minPrice) {
      priceScore = 85;
    } else {
      // Normalize price: minPrice gets 100, maxPrice gets 60
      priceScore = Math.round(100 - ((offer.price - minPrice) / (maxPrice - minPrice)) * 40);
    }
    // Bonus if price is below target budget
    if (offer.price <= targetBudget) {
      priceScore = Math.min(100, priceScore + 5);
    }

    // 2. Reliability Score (25% weight): Based on seller rating, response rate, deals completed
    const ratingPart = (seller.rating / 5) * 50; // max 50
    const responsePart = (seller.responseRate / 100) * 30; // max 30
    const verificationBonus = seller.verificationStatus === 'PREMIUM' ? 20 : 15;
    const reliabilityScore = Math.round(Math.min(100, ratingPart + responsePart + verificationBonus));

    // 3. Distance Score (15% weight): Closer is better (e.g. <1km = 100, 5km = 60)
    let distanceScore = Math.round(Math.max(40, 100 - seller.distanceKm * 10));

    // 4. Warranty Score (10% weight)
    let warrantyScore = 50;
    const lowerWarranty = sWarranty.toLowerCase();
    if (lowerWarranty.includes('1 year') || lowerWarranty.includes('brand warranty')) warrantyScore = 95;
    else if (lowerWarranty.includes('6 month')) warrantyScore = 75;
    else if (lowerWarranty.includes('no warranty')) warrantyScore = 30;
    else warrantyScore = 80;

    // 5. Delivery Score (10% weight)
    const deliveryScore = seller.deliveryOffered ? 95 : 70;

    // Calculate overall multi-factor weighted score
    const totalScore = Math.round(
      priceScore * 0.40 +
      reliabilityScore * 0.25 +
      distanceScore * 0.15 +
      warrantyScore * 0.10 +
      deliveryScore * 0.10
    );

    // Generate human-readable rationale
    let rationale = '';
    if (offer.price === minPrice && totalScore >= 85) {
      rationale = `${sName} offers the lowest price (₹${offer.price.toLocaleString('en-IN')}) with high ${seller.rating}★ reliability rating and ${sWarranty}.`;
    } else if (totalScore >= 85) {
      rationale = `${sName} is recommended despite slightly higher price due to superior ${sWarranty}, ${seller.rating}★ rating, and convenient proximity (${seller.distanceKm} km).`;
    } else {
      rationale = `Competitive quote of ₹${offer.price.toLocaleString('en-IN')} with ${sWarranty}.`;
    }

    return {
      sellerId: sId,
      sellerName: sName,
      price: offer.price,
      distanceKm: seller.distanceKm,
      rating: seller.rating,
      warranty: sWarranty,
      totalScore,
      priceScore,
      reliabilityScore,
      distanceScore,
      warrantyScore,
      deliveryScore,
      isRecommended: false, // Set dynamically after sorting
      rationale
    };
  });

  // Sort descending by total score
  dealScores.sort((a, b) => b.totalScore - a.totalScore);
  if (dealScores.length > 0) {
    dealScores[0].isRecommended = true;
  }

  return dealScores;
}
