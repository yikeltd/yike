import { getBrowsePreferences } from "@/lib/browse-preferences";
import { getRecentSearches } from "@/lib/search-recent";

const HINT_DISMISS_KEY = "yike_city_hint_dismissed";

export type InferredLocation = {
  hasSignal: boolean;
  city?: string;
  area?: string;
  hint: string;
};

export function getInferredLocation(): InferredLocation {
  if (typeof window === "undefined") {
    return { hasSignal: false, hint: "" };
  }

  const prefs = getBrowsePreferences();
  let city: string | undefined = prefs.cities[0];
  let area: string | undefined = prefs.areas[0];

  if (!city) {
    const recent = getRecentSearches()[0];
    if (recent?.href) {
      try {
        const url = new URL(recent.href, "https://yike.ng");
        city = url.searchParams.get("city") || undefined;
        area = url.searchParams.get("area") || undefined;
      } catch {
        /* ignore */
      }
    }
  }

  if (!city) {
    return { hasSignal: false, hint: "" };
  }

  const hint = area
    ? `Showing listings near ${area}`
    : `Browsing homes in ${city}?`;

  return { hasSignal: true, city, area, hint };
}

export function isCityHintDismissed(city: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(HINT_DISMISS_KEY) === city;
  } catch {
    return true;
  }
}

export function dismissCityHint(city: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HINT_DISMISS_KEY, city);
  } catch {
    /* ignore */
  }
}
