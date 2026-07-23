/**
 * Rank / filter inventory by marketplace location scope.
 * Order: same city → nearby cities → same state → nearby states → nationwide.
 */

import type { Property } from "@/types/database";
import {
  citiesMatch,
  getNearbyCities,
  getNearbyStates,
  statesMatch,
} from "./nearby";
import type { LocationRankResult, LocationScope, MarketplaceLocation } from "./types";

function scopeOf(
  p: Property,
  loc: MarketplaceLocation,
  nearbyCities: { state: string; city: string }[],
  nearbyStates: string[],
): LocationScope {
  if (loc.city && citiesMatch(p.city, loc.city)) return "city";
  if (
    loc.city &&
    nearbyCities.some(
      (c) => citiesMatch(p.city, c.city) || citiesMatch(p.area, c.city),
    )
  ) {
    return "nearby_city";
  }
  if (loc.state && statesMatch(p.state, loc.state)) return "state";
  if (nearbyStates.some((s) => statesMatch(p.state, s))) return "nearby_state";
  return "nationwide";
}

const SCOPE_WEIGHT: Record<LocationScope, number> = {
  city: 100,
  nearby_city: 70,
  state: 45,
  nearby_state: 25,
  nationwide: 0,
};

/**
 * Sort a pool by location proximity without dropping nationwide inventory.
 */
export function rankByMarketplaceLocation(
  items: Property[],
  loc: MarketplaceLocation | null | undefined,
): Property[] {
  if (!loc?.city && !loc?.state) return items;
  const nearbyCities = loc.city ? getNearbyCities(loc.city, loc.state) : [];
  const nearbyStates = loc.state ? getNearbyStates(loc.state) : [];

  return [...items].sort((a, b) => {
    const wa = SCOPE_WEIGHT[scopeOf(a, loc, nearbyCities, nearbyStates)];
    const wb = SCOPE_WEIGHT[scopeOf(b, loc, nearbyCities, nearbyStates)];
    if (wb !== wa) return wb - wa;
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
}

/**
 * Pick a rail with progressive geographic expansion.
 * Never returns empty if the pool has inventory elsewhere.
 */
export function pickLocationAwareRail(
  items: Property[],
  loc: MarketplaceLocation | null | undefined,
  limit = 6,
  opts?: {
    /** Extra predicate (featured, luxury, etc.) applied before location tiers */
    filter?: (p: Property) => boolean;
  },
): LocationRankResult {
  const pool = opts?.filter ? items.filter(opts.filter) : items;
  if (pool.length === 0) {
    return {
      items: [],
      scope: "nationwide",
      expanded: false,
      labelCity: loc?.city || undefined,
      labelState: loc?.state || undefined,
    };
  }

  if (!loc?.city && !loc?.state) {
    return {
      items: pool.slice(0, limit),
      scope: "nationwide",
      expanded: false,
    };
  }

  const nearbyCities = loc.city ? getNearbyCities(loc.city, loc.state) : [];
  const nearbyStates = loc.state ? getNearbyStates(loc.state) : [];

  const tiers: { scope: LocationScope; match: (p: Property) => boolean }[] = [];

  if (loc.city) {
    tiers.push(
      {
        scope: "city",
        match: (p) =>
          citiesMatch(p.city, loc.city) || citiesMatch(p.area, loc.city),
      },
      {
        scope: "nearby_city",
        match: (p) =>
          nearbyCities.some(
            (c) => citiesMatch(p.city, c.city) || citiesMatch(p.area, c.city),
          ),
      },
    );
  }

  if (loc.state) {
    tiers.push(
      {
        scope: "state",
        match: (p) => statesMatch(p.state, loc.state),
      },
      {
        scope: "nearby_state",
        match: (p) => nearbyStates.some((s) => statesMatch(p.state, s)),
      },
    );
  }

  tiers.push({
    scope: "nationwide",
    match: () => true,
  });

  for (const tier of tiers) {
    const matched = pool.filter(tier.match);
    if (matched.length > 0) {
      return {
        items: matched.slice(0, limit),
        scope: tier.scope,
        expanded: Boolean(loc.city) ? tier.scope !== "city" : tier.scope !== "state",
        labelCity: loc.city || undefined,
        labelState: loc.state || undefined,
      };
    }
  }

  return {
    items: pool.slice(0, limit),
    scope: "nationwide",
    expanded: true,
    labelCity: loc.city || undefined,
    labelState: loc.state || undefined,
  };
}

export function scopeSubtitle(
  scope: LocationScope,
  city?: string,
  state?: string,
): string | undefined {
  switch (scope) {
    case "city":
      return city ? `In ${city}` : undefined;
    case "nearby_city":
      return city ? "Showing nearby listings." : undefined;
    case "state":
      return state ? `In ${state}` : undefined;
    case "nearby_state":
      return "Showing nearby listings.";
    case "nationwide":
      // Silent expansion — inventory speaks; avoid debug-style notices.
      return undefined;
    default:
      return undefined;
  }
}
