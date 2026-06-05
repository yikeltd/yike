import type { Property } from "@/types/database";

const KEY = "yike_browse_prefs";
const VIEWED_KEY = "yike_viewed_listings";
const SAVED_KEY = "yike_saved_ids";

export type BrowsePreferences = {
  cities: string[];
  areas: string[];
  listingTypes: string[];
  propertyTypes: string[];
  minPrice?: number;
  maxPrice?: number;
  updatedAt: number;
};

function empty(): BrowsePreferences {
  return {
    cities: [],
    areas: [],
    listingTypes: [],
    propertyTypes: [],
    updatedAt: 0,
  };
}

export function getBrowsePreferences(): BrowsePreferences {
  if (typeof window === "undefined") return empty();
  try {
    return { ...empty(), ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return empty();
  }
}

export function saveBrowsePreferences(partial: {
  city?: string;
  area?: string;
  listingType?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
}) {
  const prev = getBrowsePreferences();
  const cities = partial.city
    ? [partial.city, ...prev.cities.filter((c) => c !== partial.city)].slice(0, 5)
    : prev.cities;
  const areas = partial.area
    ? [partial.area, ...prev.areas.filter((a) => a !== partial.area)].slice(0, 6)
    : prev.areas;
  const listingTypes = partial.listingType
    ? [
        partial.listingType,
        ...prev.listingTypes.filter((t) => t !== partial.listingType),
      ].slice(0, 3)
    : prev.listingTypes;
  const propertyTypes = partial.propertyType
    ? [
        partial.propertyType,
        ...prev.propertyTypes.filter((t) => t !== partial.propertyType),
      ].slice(0, 3)
    : prev.propertyTypes;

  localStorage.setItem(
    KEY,
    JSON.stringify({
      cities,
      areas,
      listingTypes,
      propertyTypes,
      minPrice: partial.minPrice ?? prev.minPrice,
      maxPrice: partial.maxPrice ?? prev.maxPrice,
      updatedAt: Date.now(),
    })
  );
}

export function trackViewedListing(id: string) {
  try {
    const raw = JSON.parse(localStorage.getItem(VIEWED_KEY) ?? "[]") as string[];
    const next = [id, ...raw.filter((x) => x !== id)].slice(0, 40);
    localStorage.setItem(VIEWED_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function getViewedListingIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(VIEWED_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function getSavedListingIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

/** Merge recent search URLs into browse preferences. */
export function syncBrowseFromRecentSearches() {
  try {
    const raw = localStorage.getItem("yike_recent_searches");
    if (!raw) return;
    const searches = JSON.parse(raw) as { href: string }[];
    for (const s of searches) {
      const url = new URL(s.href, "https://yike.ng");
      saveBrowsePreferences({
        city: url.searchParams.get("city") || undefined,
        area: url.searchParams.get("area") || undefined,
        listingType: url.searchParams.get("type") || undefined,
        propertyType: url.searchParams.get("property_type") || undefined,
        minPrice: url.searchParams.get("min")
          ? Number(url.searchParams.get("min"))
          : undefined,
        maxPrice: url.searchParams.get("max")
          ? Number(url.searchParams.get("max"))
          : undefined,
      });
    }
  } catch {
    /* ignore */
  }
}

function scoreProperty(p: Property, prefs: BrowsePreferences): number {
  let score = 0;
  const cityMatch = prefs.cities.findIndex(
    (c) => c.toLowerCase() === p.city.toLowerCase()
  );
  if (cityMatch >= 0) score += 50 - cityMatch * 6;

  const areaMatch = prefs.areas.findIndex(
    (a) => a.toLowerCase() === p.area.toLowerCase()
  );
  if (areaMatch >= 0) score += 35 - areaMatch * 5;

  const typeMatch = prefs.listingTypes.findIndex((t) => t === p.listing_type);
  if (typeMatch >= 0) score += 25 - typeMatch * 4;

  const ptMatch = prefs.propertyTypes.findIndex(
    (t) => t === p.property_type
  );
  if (ptMatch >= 0) score += 20 - ptMatch * 3;

  if (prefs.minPrice || prefs.maxPrice) {
    const price = Number(p.price);
    if (prefs.minPrice && price >= prefs.minPrice) score += 8;
    if (prefs.maxPrice && price <= prefs.maxPrice) score += 8;
    if (prefs.minPrice && prefs.maxPrice) {
      if (price >= prefs.minPrice && price <= prefs.maxPrice) score += 12;
    }
  }

  return score;
}

export function rankPropertiesForBrowse(
  properties: Property[],
  prefs: BrowsePreferences
): Property[] {
  const viewed = new Set(getViewedListingIds());
  const hasPrefs =
    prefs.cities.length > 0 ||
    prefs.areas.length > 0 ||
    prefs.listingTypes.length > 0 ||
    prefs.propertyTypes.length > 0 ||
    prefs.minPrice ||
    prefs.maxPrice;

  if (!hasPrefs) return properties;

  return [...properties].sort((a, b) => {
    const diff =
      scoreProperty(b, prefs) - scoreProperty(a, prefs) ||
      (viewed.has(a.id) ? 1 : 0) - (viewed.has(b.id) ? 1 : 0) ||
      (b.views_count ?? 0) - (a.views_count ?? 0);
    return diff;
  });
}
