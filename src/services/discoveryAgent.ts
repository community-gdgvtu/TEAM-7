import { SEEDED_SELLERS } from '../data/seededSellers';
import type { Requirement, Seller } from '../types';

/**
 * Agent 2 — Seller Discovery Agent
 * Finds relevant verified local sellers based on extracted product requirements.
 */
export function discoverLocalSellers(requirement: Requirement): Seller[] {
  // Filter sellers matching the requested category
  const matchingCategory = SEEDED_SELLERS.filter(
    (seller) => seller.category === requirement.category
  );

  // If we have category matches, sort by rating & distance
  if (matchingCategory.length >= 3) {
    return matchingCategory.sort((a, b) => b.rating - a.rating || a.distanceKm - b.distanceKm).slice(0, 4);
  }

  // Fallback: Return top 4 general high-rated sellers
  return SEEDED_SELLERS.slice(0, 4);
}
