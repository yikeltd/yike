/**
 * Future-ready capability flags — structure only, not implemented.
 * Use when adding geolocation, maps, alerts, AI, mobile API, etc.
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
  preferredListingTypes?: string[];
  priceBand?: { min: number; max: number };
};

export type FutureMobileApiSurface = {
  version: "v1-preview";
  endpoints: {
    listings: "/api/v1/listings";
    search: "/api/v1/search";
    favorites: "/api/v1/favorites";
    recommendations: "/api/v1/recommendations";
    events: "/api/v1/events";
  };
};

export const FUTURE_MOBILE_API: FutureMobileApiSurface = {
  version: "v1-preview",
  endpoints: {
    listings: "/api/v1/listings",
    search: "/api/v1/search",
    favorites: "/api/v1/favorites",
    recommendations: "/api/v1/recommendations",
    events: "/api/v1/events",
  },
};

/** Build recommendation context from client storage — wire to engine later. */
export function buildRecommendationContext(
  partial?: Partial<FutureRecommendationContext>
): FutureRecommendationContext {
  return { ...partial };
}
