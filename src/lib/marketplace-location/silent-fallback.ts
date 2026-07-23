/**
 * Silent location fallback when Near Me geolocation fails.
 * Never surfaces permission errors — keep browsing unblocked.
 *
 * Order: last selected → browser locale/timezone hint → Nationwide (null).
 */

import { resolveCityCentroid } from "./centroids";
import {
  getMarketplaceLocation,
  setMarketplaceLocation,
  setNationwideMarketplaceLocation,
} from "./preference";
import type { MarketplaceLocation } from "./types";

/** Soft Nigeria hints from browser locale / timezone (no IP geolocation). */
export function localeMarketplaceHint(): MarketplaceLocation | null {
  if (typeof window === "undefined") return null;

  try {
    const lang = (navigator.language || "").toLowerCase();
    const langs = (navigator.languages ?? []).map((l) => l.toLowerCase());
    const tz =
      Intl.DateTimeFormat().resolvedOptions().timeZone?.toLowerCase() ?? "";

    const suggestsNg =
      lang.includes("-ng") ||
      langs.some((l) => l.includes("-ng")) ||
      tz === "africa/lagos";

    if (!suggestsNg) return null;

    // Africa/Lagos is national TZ — soft-default Lagos state (not a hard city).
    const centroid = resolveCityCentroid("Lagos", "Lagos");
    return setMarketplaceLocation({
      state: "Lagos",
      city: "",
      lat: centroid?.lat,
      lng: centroid?.lng,
      source: "locale",
    });
  } catch {
    return null;
  }
}

/**
 * Apply silent fallback after geo denial/failure.
 * Returns the location used (null = Nationwide).
 */
export function applySilentLocationFallback(
  previous: MarketplaceLocation | null = getMarketplaceLocation(),
): MarketplaceLocation | null {
  if (previous?.city?.trim() || previous?.state?.trim()) {
    return previous;
  }

  const hinted = localeMarketplaceHint();
  if (hinted) return hinted;

  setNationwideMarketplaceLocation();
  return null;
}
