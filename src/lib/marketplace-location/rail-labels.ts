/**
 * Localized discovery rail titles / hrefs for Inventory First homepage.
 */

import type { LocationScope, MarketplaceLocation, RailCopy } from "./types";
import { scopeSubtitle } from "./rank";

export type MarketplaceRailKind = "property" | "vehicle" | "electronics";

function featuredBaseHref(kind: MarketplaceRailKind): string {
  if (kind === "vehicle") return "/vehicles?sort=featured";
  if (kind === "electronics") return "/electronics";
  return "/search?featured=1";
}

function browseBaseHref(kind: MarketplaceRailKind): string {
  if (kind === "vehicle") return "/vehicles";
  if (kind === "electronics") return "/electronics";
  return "/search";
}

export function featuredRailCopy(
  loc: MarketplaceLocation | null | undefined,
  scope: LocationScope,
  kind: MarketplaceRailKind,
): RailCopy {
  const city = loc?.city;
  const state = loc?.state;
  const baseHref = featuredBaseHref(kind);
  if (city && scope === "city") {
    return {
      title: `Featured in ${city}`,
      subtitle: undefined,
      href: `${baseHref}&city=${encodeURIComponent(city)}`,
    };
  }
  if (city) {
    return {
      title: "Featured Near You",
      subtitle: scopeSubtitle(scope, city, state),
      href: `${baseHref}&city=${encodeURIComponent(city)}`,
    };
  }
  if (state) {
    return {
      title: `Featured in ${state}`,
      subtitle: scopeSubtitle(scope, undefined, state),
      href: `${baseHref}&state=${encodeURIComponent(state)}`,
    };
  }
  return {
    title: "Featured",
    href: baseHref,
  };
}

export function recentRailCopy(
  loc: MarketplaceLocation | null | undefined,
  scope: LocationScope,
  kind: MarketplaceRailKind,
): RailCopy {
  const city = loc?.city;
  const state = loc?.state;
  const baseHref = browseBaseHref(kind);
  if (city && scope === "city") {
    return {
      title: `Recently Added in ${city}`,
      href: `${baseHref}?city=${encodeURIComponent(city)}`,
    };
  }
  if (city) {
    return {
      title: "Recently Added Near You",
      subtitle: scopeSubtitle(scope, city, state),
      href: `${baseHref}?city=${encodeURIComponent(city)}`,
    };
  }
  if (state) {
    return {
      title: `Recently Added in ${state}`,
      href: `${baseHref}?state=${encodeURIComponent(state)}`,
    };
  }
  return { title: "Recently Added", href: baseHref };
}

export function trendingRailCopy(
  loc: MarketplaceLocation | null | undefined,
  scope: LocationScope,
  kind: MarketplaceRailKind,
): RailCopy {
  const city = loc?.city;
  const state = loc?.state;
  const baseHref = browseBaseHref(kind);
  if (city && (scope === "city" || scope === "nearby_city")) {
    return {
      title: "Trending in Your City",
      subtitle: scope === "city" ? `Popular in ${city}` : scopeSubtitle(scope, city, state),
      href: city ? `${baseHref}?city=${encodeURIComponent(city)}` : baseHref,
    };
  }
  if (state) {
    return {
      title: `Popular in ${state}`,
      subtitle: scopeSubtitle(scope, city, state),
      href: `${baseHref}?state=${encodeURIComponent(state)}`,
    };
  }
  return {
    title: "Trending",
    href: baseHref,
  };
}

export function nearbyDealsRailCopy(
  loc: MarketplaceLocation | null | undefined,
  scope: LocationScope,
  kind: "property" | "vehicle",
): RailCopy {
  const city = loc?.city;
  const baseHref = kind === "vehicle" ? "/vehicles" : "/search";
  return {
    title: "Nearby Deals",
    subtitle: scopeSubtitle(scope, city, loc?.state) ??
      (city ? `Around ${city}` : "Good prices near you"),
    href: city
      ? `${baseHref}?city=${encodeURIComponent(city)}`
      : baseHref,
  };
}

export function nationwideRailCopy(kind: MarketplaceRailKind): RailCopy {
  return {
    title: "Across Nigeria",
    href: browseBaseHref(kind),
  };
}

export function luxuryRailCopy(
  loc: MarketplaceLocation | null | undefined,
  scope: LocationScope,
  kind: MarketplaceRailKind,
): RailCopy {
  const href =
    kind === "vehicle"
      ? "/vehicles?min_price=25000000"
      : kind === "electronics"
        ? "/electronics?min_price=500000"
        : "/search?min=50000000";
  const city = loc?.city;
  return {
    title: "Luxury Collection",
    subtitle:
      city && scope !== "nationwide"
        ? scopeSubtitle(scope, city, loc?.state)
        : undefined,
    href: city ? `${href}&city=${encodeURIComponent(city)}` : href,
  };
}

export function lowMileageRailCopy(
  loc: MarketplaceLocation | null | undefined,
  scope: LocationScope,
): RailCopy {
  const city = loc?.city;
  return {
    title: "Low Mileage",
    subtitle:
      city && scope !== "nationwide"
        ? scopeSubtitle(scope, city, loc?.state) ?? "Sorted by lowest km"
        : "Sorted by lowest km",
    href: city
      ? `/vehicles?max_mileage=80000&city=${encodeURIComponent(city)}`
      : "/vehicles?max_mileage=80000",
  };
}
