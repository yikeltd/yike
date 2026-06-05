import type { Property } from "@/types/database";

const KEY = "yike_browse_prefs";

export type BrowsePreferences = {
  cities: string[];
  areas: string[];
  listingTypes: string[];
  updatedAt: number;
};

function empty(): BrowsePreferences {
  return { cities: [], areas: [], listingTypes: [], updatedAt: 0 };
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

  localStorage.setItem(
    KEY,
    JSON.stringify({ cities, areas, listingTypes, updatedAt: Date.now() })
  );
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
      });
    }
  } catch {
    /* ignore */
  }
}

function scoreProperty(
  p: { city: string; area: string; listing_type: string },
  prefs: BrowsePreferences
): number {
  let score = 0;
  const cityMatch = prefs.cities.findIndex(
    (c) => c.toLowerCase() === p.city.toLowerCase()
  );
  if (cityMatch >= 0) score += 40 - cityMatch * 5;

  const areaMatch = prefs.areas.findIndex(
    (a) => a.toLowerCase() === p.area.toLowerCase()
  );
  if (areaMatch >= 0) score += 30 - areaMatch * 4;

  const typeMatch = prefs.listingTypes.findIndex((t) => t === p.listing_type);
  if (typeMatch >= 0) score += 20 - typeMatch * 3;

  return score;
}

export function rankPropertiesForBrowse(
  properties: Property[],
  prefs: BrowsePreferences
): Property[] {
  if (
    prefs.cities.length === 0 &&
    prefs.areas.length === 0 &&
    prefs.listingTypes.length === 0
  ) {
    return properties;
  }

  return [...properties].sort((a, b) => {
    const diff =
      scoreProperty(b, prefs) - scoreProperty(a, prefs) ||
      (b.views_count ?? 0) - (a.views_count ?? 0);
    return diff;
  });
}
