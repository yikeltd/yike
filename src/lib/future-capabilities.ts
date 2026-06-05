/**
 * Future-ready capability flags — structure only, not implemented.
 * Use when adding geolocation, maps, alerts, AI, etc.
 */

export type FutureListingAmenities = {
  furnished?: boolean;
  serviced?: boolean;
  pet_friendly?: boolean;
  parking?: boolean;
  security?: boolean;
  solar?: boolean;
  prepaid_meter?: boolean;
};

export type FutureSearchCapabilities = {
  geolocation?: { lat: number; lng: number; radiusKm: number };
  savedSearchId?: string;
  alertEnabled?: boolean;
  mapBounds?: { north: number; south: number; east: number; west: number };
};

export type FutureAgentTrust = {
  response_time_minutes?: number;
  review_score?: number;
  successful_transactions?: number;
  repeat_landlord_score?: number;
  whatsapp_verified?: boolean;
};

export type FutureRecommendationContext = {
  userId?: string;
  viewedPropertyIds?: string[];
  savedPropertyIds?: string[];
  preferredCities?: string[];
};

/** Placeholder — wire to recommendation engine later */
export function buildRecommendationContext(): FutureRecommendationContext {
  return {};
}
