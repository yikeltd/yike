/**
 * Inventory-first homepage rail selectors.
 * Location-aware: same city → nearby → state → nearby states → nationwide.
 */

import type { Property } from "@/types/database";
import { isBoostedActive, isFeaturedActive } from "@/lib/agent-tiers";
import {
  pickLocationAwareRail,
  rankByMarketplaceLocation,
  type LocationRankResult,
  type MarketplaceLocation,
} from "@/lib/marketplace-location";

/** Sale / total price tier that reads as luxury on Nigerian home feed. */
export const PROPERTY_LUXURY_MIN_PRICE = 50_000_000;
/** High-end vehicle price floor (NGN). */
export const VEHICLE_LUXURY_MIN_PRICE = 25_000_000;
/** Prefer cars under this km for "Low Mileage". */
export const VEHICLE_LOW_MILEAGE_MAX = 80_000;

const LUXURY_PROPERTY_TYPES = new Set([
  "mansion",
  "detached_duplex",
  "terrace_duplex",
  "penthouse",
]);

/** Tier-2 launch cities — used only when no preferred location is set. */
export const NEAR_YOU_FALLBACK_CITIES = [
  "Aba",
  "Enugu",
  "Owerri",
  "Port Harcourt",
  "Yola",
  "Uyo",
] as const;

export function pickFeaturedRail(
  items: Property[],
  limit = 6,
  loc?: MarketplaceLocation | null,
): LocationRankResult {
  if (loc?.city) {
    const featuredOnly = pickLocationAwareRail(items, loc, limit, {
      filter: (p) => isBoostedActive(p) || isFeaturedActive(p),
    });
    // Never leave a blank featured rail when inventory exists elsewhere
    if (featuredOnly.items.length > 0) return featuredOnly;
    return pickLocationAwareRail(items, loc, limit);
  }
  const featured = items.filter(
    (p) => isBoostedActive(p) || isFeaturedActive(p),
  );
  const pool = featured.length > 0 ? featured : items;
  return {
    items: pool.slice(0, limit),
    scope: "nationwide",
    expanded: featured.length === 0 && items.length > 0,
  };
}

export function pickRecentRail(
  items: Property[],
  limit = 6,
  loc?: MarketplaceLocation | null,
): LocationRankResult {
  const sorted = [...items].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  if (loc?.city) {
    return pickLocationAwareRail(sorted, loc, limit);
  }
  return {
    items: sorted.slice(0, limit),
    scope: "nationwide",
    expanded: false,
  };
}

export function isLuxuryProperty(p: Property): boolean {
  const type = (p.property_type ?? "").toLowerCase();
  if (LUXURY_PROPERTY_TYPES.has(type) || type.includes("mansion")) return true;
  const price = Number(p.price) || 0;
  if (p.listing_type === "sale") {
    return price >= PROPERTY_LUXURY_MIN_PRICE;
  }
  if (
    p.listing_type === "rent" ||
    p.listing_type === "shortlet" ||
    p.listing_type === "lease"
  ) {
    return price >= 5_000_000;
  }
  return price >= PROPERTY_LUXURY_MIN_PRICE;
}

export function isLuxuryVehicle(p: Property): boolean {
  const price = Number(p.price) || 0;
  if (price >= VEHICLE_LUXURY_MIN_PRICE) return true;
  const make = (p.make ?? "").toLowerCase();
  const luxuryMakes = [
    "mercedes",
    "bmw",
    "lexus",
    "audi",
    "porsche",
    "land rover",
    "range rover",
    "toyota land cruiser",
  ];
  return luxuryMakes.some(
    (m) => make.includes(m) || (p.title ?? "").toLowerCase().includes(m),
  );
}

export function pickLuxuryRail(
  items: Property[],
  kind: "property" | "vehicle",
  limit = 6,
  loc?: MarketplaceLocation | null,
): LocationRankResult {
  const matched = items.filter((p) =>
    kind === "vehicle" ? isLuxuryVehicle(p) : isLuxuryProperty(p),
  );
  const pool =
    matched.length > 0
      ? [...matched].sort((a, b) => Number(b.price) - Number(a.price))
      : [...items].sort((a, b) => Number(b.price) - Number(a.price));

  if (loc?.city) {
    return pickLocationAwareRail(pool, loc, limit);
  }
  return {
    items: pool.slice(0, limit),
    scope: "nationwide",
    expanded: matched.length === 0,
  };
}

/**
 * Near You / Nearby Deals — progressive expansion with honest scope.
 * Never defaults to Lagos/Abuja when a preferred city exists.
 */
export function pickNearYouRail(
  items: Property[],
  preferredCity: string | undefined,
  limit = 6,
  loc?: MarketplaceLocation | null,
): LocationRankResult & { mode: "city" | "popular"; cityLabel?: string } {
  const location: MarketplaceLocation | null =
    loc?.city
      ? loc
      : preferredCity?.trim()
        ? {
            city: preferredCity.trim(),
            state: loc?.state ?? "",
            source: "inferred",
            updatedAt: 0,
          }
        : null;

  if (location?.city) {
    const result = pickLocationAwareRail(items, location, limit);
    return {
      ...result,
      mode: result.scope === "city" ? "city" : "popular",
      cityLabel: location.city,
    };
  }

  // No preferred location — soft popular tier-2 cities (not Lagos-first)
  const popular = items.filter((p) =>
    NEAR_YOU_FALLBACK_CITIES.some(
      (c) =>
        p.city?.toLowerCase() === c.toLowerCase() ||
        p.city?.toLowerCase().includes(c.toLowerCase()),
    ),
  );
  if (popular.length > 0) {
    return {
      items: popular.slice(0, limit),
      mode: "popular",
      scope: "nationwide",
      expanded: true,
    };
  }

  const recent = pickRecentRail(items, limit);
  return {
    ...recent,
    mode: "popular",
    expanded: true,
  };
}

export function pickLowMileageRail(
  items: Property[],
  limit = 6,
  loc?: MarketplaceLocation | null,
): LocationRankResult {
  const withMileage = items.filter(
    (p) => p.mileage != null && Number(p.mileage) >= 0,
  );
  const preferred = withMileage.filter(
    (p) => Number(p.mileage) <= VEHICLE_LOW_MILEAGE_MAX,
  );
  const pool = preferred.length > 0 ? preferred : withMileage;
  const sorted =
    pool.length > 0
      ? [...pool].sort((a, b) => Number(a.mileage) - Number(b.mileage))
      : [...items].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

  if (loc?.city) {
    return pickLocationAwareRail(sorted, loc, limit);
  }
  return {
    items: sorted.slice(0, limit),
    scope: "nationwide",
    expanded: false,
  };
}

/** Nationwide featured slice — always available lower on the page. */
export function pickNationwideFeaturedRail(
  items: Property[],
  limit = 6,
  loc?: MarketplaceLocation | null,
): Property[] {
  const featured = items.filter(
    (p) => isBoostedActive(p) || isFeaturedActive(p),
  );
  const pool = featured.length > 0 ? featured : items;
  // Prefer showing inventory outside the local city so the rail feels national
  if (loc?.city) {
    const outside = pool.filter(
      (p) => p.city?.toLowerCase() !== loc.city.toLowerCase(),
    );
    if (outside.length >= Math.min(3, limit)) {
      return outside.slice(0, limit);
    }
  }
  return pool.slice(0, limit);
}

/** Trending / popular in city or state — recent + engagement proxy. */
export function pickTrendingRail(
  items: Property[],
  limit = 6,
  loc?: MarketplaceLocation | null,
): LocationRankResult {
  const sorted = [...items].sort((a, b) => {
    const eng =
      (b.views_count ?? 0) + (b.contact_clicks ?? 0) * 3 -
      ((a.views_count ?? 0) + (a.contact_clicks ?? 0) * 3);
    if (eng !== 0) return eng;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  if (loc?.city) {
    return pickLocationAwareRail(sorted, loc, limit);
  }
  return {
    items: sorted.slice(0, limit),
    scope: "nationwide",
    expanded: false,
  };
}

export function applyLocationOrder(
  items: Property[],
  loc?: MarketplaceLocation | null,
): Property[] {
  return rankByMarketplaceLocation(items, loc ?? null);
}

export function dedupeById(items: Property[]): Property[] {
  return items.filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);
}
