/**
 * Marketplace location preference — localStorage + cookies.
 * Server personalization reads cookies; client owns the source of truth.
 * Return visits: localStorage wins; cookies are re-hydrated so SSR stays aligned.
 */

import { syncMarketplaceLocationCookies } from "@/lib/search-pref-cookies";
import { notifyActivityChanged } from "@/lib/activity-events";
import { saveBrowsePreferences } from "@/lib/browse-preferences";
import type { MarketplaceLocation, MarketplaceLocationSource } from "./types";

const KEY = "yike_marketplace_location";
const PROMPT_KEY = "yike_location_prompt_seen";

function readCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return match.slice(name.length + 1);
  }
}

function normalizeLocation(
  parsed: Partial<MarketplaceLocation> | null | undefined,
): MarketplaceLocation | null {
  const city = (parsed?.city ?? "").trim();
  const state = (parsed?.state ?? "").trim();
  // City, or state-wide (empty city), both count as a saved preference.
  // Empty city + empty state → nationwide (null).
  if (!city && !state) return null;
  return {
    city,
    state,
    area: parsed?.area?.trim() || undefined,
    lat: typeof parsed?.lat === "number" && Number.isFinite(parsed.lat)
      ? parsed.lat
      : undefined,
    lng: typeof parsed?.lng === "number" && Number.isFinite(parsed.lng)
      ? parsed.lng
      : undefined,
    source: parsed?.source ?? "cookie",
    updatedAt:
      typeof parsed?.updatedAt === "number" && Number.isFinite(parsed.updatedAt)
        ? parsed.updatedAt
        : Date.now(),
  };
}

export function getMarketplaceLocation(): MarketplaceLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return normalizeLocation(JSON.parse(raw) as MarketplaceLocation);
  } catch {
    return null;
  }
}

/**
 * Re-apply saved location to cookies (and refresh max-age).
 * Call on every homepage/header mount so Enugu stays Enugu across visits
 * even if cookies expired or PrefSync tried to overwrite with browse history.
 *
 * @returns `{ location, cookiesWereStale }` — stale means SSR may need refresh.
 */
export function ensureMarketplaceLocationPersisted(): {
  location: MarketplaceLocation | null;
  cookiesWereStale: boolean;
} {
  const location = getMarketplaceLocation();
  if (!location) {
    return { location: null, cookiesWereStale: false };
  }

  const cookieCity = readCookieValue("yike_pref_city") ?? "";
  const cookieState = readCookieValue("yike_pref_state") ?? "";
  const cookiesWereStale =
    cookieCity.toLowerCase() !== location.city.toLowerCase() ||
    cookieState.toLowerCase() !== location.state.toLowerCase();

  syncMarketplaceLocationCookies({
    state: location.state,
    city: location.city,
    area: location.area,
    lat: location.lat,
    lng: location.lng,
  });

  // Soft-align browse prefs without clobbering other inferred cities ranking
  if (location.city) {
    saveBrowsePreferences({
      city: location.city,
      area: location.area,
    });
  }

  // Preference exists → never re-prompt onboarding
  markLocationPromptSeen();

  return { location, cookiesWereStale };
}

export function setMarketplaceLocation(
  partial: {
    state: string;
    city?: string;
    area?: string;
    lat?: number;
    lng?: number;
    source: MarketplaceLocationSource;
  },
): MarketplaceLocation {
  const next: MarketplaceLocation = {
    state: partial.state.trim(),
    city: (partial.city ?? "").trim(),
    area: partial.area?.trim() || undefined,
    lat: partial.lat,
    lng: partial.lng,
    source: partial.source,
    updatedAt: Date.now(),
  };

  if (!next.city && !next.state) {
    clearMarketplaceLocation();
    markLocationPromptSeen();
    return next;
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  syncMarketplaceLocationCookies({
    state: next.state,
    city: next.city,
    area: next.area,
    lat: next.lat,
    lng: next.lng,
  });

  // Keep browse prefs aligned so legacy Near You / inferred location stay in sync
  if (next.city) {
    saveBrowsePreferences({
      city: next.city,
      area: next.area,
    });
  }

  markLocationPromptSeen();
  notifyActivityChanged();
  return next;
}

/** Explicit nationwide scope — clears city/state prefs, remembers choice. */
export function setNationwideMarketplaceLocation() {
  clearMarketplaceLocation();
  markLocationPromptSeen();
}

export function clearMarketplaceLocation() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  syncMarketplaceLocationCookies({ clear: true });
  notifyActivityChanged();
}

export function hasSeenLocationPrompt(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(PROMPT_KEY) === "1";
  } catch {
    return true;
  }
}

export function markLocationPromptSeen() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROMPT_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** Display label for indicator chip — city, else state, else Nigeria. */
export function marketplaceLocationLabel(
  loc: Pick<MarketplaceLocation, "city" | "state"> | null | undefined,
): string {
  if (loc?.city?.trim()) return loc.city.trim();
  if (loc?.state?.trim()) return loc.state.trim();
  return "Nigeria";
}

/** True when browsing nationwide (no city/state preference). */
export function isNationwideMarketplaceLocation(
  loc: MarketplaceLocation | null | undefined,
): boolean {
  return !loc?.city?.trim() && !loc?.state?.trim();
}
