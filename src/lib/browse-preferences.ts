import type { Property } from "@/types/database";
import { parseSmartSearchQuery } from "@/lib/smart-search";
import { propertyMarketRank } from "@/lib/agent-tiers";
import { syncSearchPrefCookies } from "@/lib/search-pref-cookies";
import { notifyActivityChanged } from "@/lib/activity-events";

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

  syncSearchPrefCookies({
    city: partial.city ?? cities[0],
    area: partial.area ?? areas[0],
    listingType: partial.listingType ?? listingTypes[0],
  });
  notifyActivityChanged();
}

export type ListingInteraction = {
  id?: string;
  city: string;
  area?: string;
  listingType?: string;
  propertyType?: string | null;
};

/** Learn city, area, and types from views, saves, swipes, and contact clicks. */
export function trackListingInteraction(p: ListingInteraction) {
  if (!p.city?.trim()) return;
  saveBrowsePreferences({
    city: p.city,
    area: p.area,
    listingType: p.listingType,
    propertyType: p.propertyType || undefined,
  });
}

export function trackViewedListing(id: string, meta?: Omit<ListingInteraction, "id">) {
  try {
    const raw = JSON.parse(localStorage.getItem(VIEWED_KEY) ?? "[]") as string[];
    const next = [id, ...raw.filter((x) => x !== id)].slice(0, 40);
    localStorage.setItem(VIEWED_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  if (meta?.city) trackListingInteraction({ ...meta, id });
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
      const q = url.searchParams.get("q");
      if (q) {
        const parsed = parseSmartSearchQuery(q);
        saveBrowsePreferences({
          city: parsed.city,
          area: parsed.area,
          listingType: parsed.listing_type,
          propertyType: parsed.property_type,
          minPrice: parsed.min_price,
          maxPrice: parsed.max_price,
        });
      }
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

function matchesBrowsePrefs(p: Property, prefs: BrowsePreferences): boolean {
  if (prefs.cities.length > 0) {
    const cityOk = prefs.cities.some(
      (c) => c.toLowerCase() === p.city.toLowerCase()
    );
    if (!cityOk) return false;
  }
  if (prefs.areas.length > 0) {
    const areaOk = prefs.areas.some(
      (a) => a.toLowerCase() === p.area.toLowerCase()
    );
    if (!areaOk) return false;
  }
  if (prefs.listingTypes.length > 0 && !prefs.listingTypes.includes(p.listing_type)) {
    return false;
  }
  if (
    prefs.propertyTypes.length > 0 &&
    p.property_type &&
    !prefs.propertyTypes.includes(p.property_type)
  ) {
    return false;
  }
  if (prefs.minPrice && Number(p.price) < prefs.minPrice) return false;
  if (prefs.maxPrice && Number(p.price) > prefs.maxPrice) return false;
  return true;
}

/** Drop listings that conflict with strong user prefs (e.g. Aba search → no Abuja mansions). */
export function filterPropertiesForBrowse(
  properties: Property[],
  prefs: BrowsePreferences
): Property[] {
  const hasStrongPrefs =
    prefs.cities.length > 0 ||
    prefs.areas.length > 0 ||
    prefs.propertyTypes.length > 0;

  if (!hasStrongPrefs) return properties;

  const filtered = properties.filter((p) => matchesBrowsePrefs(p, prefs));

  if (prefs.cities.length > 0) {
    return filtered.length > 0 ? filtered : properties;
  }

  return filtered.length >= 3 ? filtered : properties;
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

  const pool = filterPropertiesForBrowse(properties, prefs);

  if (!hasPrefs) {
    return pool.filter((p) => !viewed.has(p.id)).concat(pool.filter((p) => viewed.has(p.id)));
  }

  return [...pool].sort((a, b) => {
    const diff =
      scoreProperty(b, prefs) - scoreProperty(a, prefs) ||
      propertyMarketRank(b) - propertyMarketRank(a) ||
      (viewed.has(a.id) ? 1 : 0) - (viewed.has(b.id) ? 1 : 0) ||
      (b.views_count ?? 0) - (a.views_count ?? 0);
    return diff;
  });
}

/** Record a saved listing id for guest personalization. */
export function trackSavedListing(id: string, meta?: Omit<ListingInteraction, "id">) {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]") as string[];
    const next = [id, ...raw.filter((x) => x !== id)].slice(0, 30);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  if (meta?.city) trackListingInteraction({ ...meta, id });
}
