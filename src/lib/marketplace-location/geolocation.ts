/**
 * Browser geolocation → nearest Nigerian city.
 * No external geocoding API — uses local city centroids.
 */

import { nearestCityCentroid } from "./centroids";
import {
  getMarketplaceLocation,
  hasSeenLocationPrompt,
  markLocationPromptSeen,
  setMarketplaceLocation,
} from "./preference";
import type { MarketplaceLocation } from "./types";

export type GeoFailReason = "unsupported" | "denied" | "unavailable" | "timeout";

export type GeoResolveResult =
  | { ok: true; location: MarketplaceLocation; distanceKm: number }
  | { ok: false; reason: GeoFailReason };

function mapGeoError(err: GeolocationPositionError): GeoFailReason {
  if (err.code === err.PERMISSION_DENIED) return "denied";
  if (err.code === err.TIMEOUT) return "timeout";
  return "unavailable";
}

export function requestMarketplaceGeolocation(
  options?: PositionOptions,
): Promise<GeoResolveResult> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return Promise.resolve({ ok: false, reason: "unsupported" });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const nearest = nearestCityCentroid(latitude, longitude);
        if (!nearest) {
          resolve({ ok: false, reason: "unavailable" });
          return;
        }
        // Reject absurd matches (>250 km from any known city)
        if (nearest.distanceKm > 250) {
          resolve({ ok: false, reason: "unavailable" });
          return;
        }
        const location = setMarketplaceLocation({
          state: nearest.centroid.state,
          city: nearest.centroid.city,
          lat: latitude,
          lng: longitude,
          source: "geo",
        });
        markLocationPromptSeen();
        resolve({
          ok: true,
          location,
          distanceKm: nearest.distanceKm,
        });
      },
      (err) => {
        markLocationPromptSeen();
        resolve({ ok: false, reason: mapGeoError(err) });
      },
      {
        enableHighAccuracy: false,
        timeout: 12_000,
        maximumAge: 60_000 * 30,
        ...options,
      },
    );
  });
}

/**
 * First-visit check only — does not auto-request geolocation.
 * Prompt UI asks Allow / Not Now; geo runs only on Allow.
 */
export async function bootstrapMarketplaceLocation(): Promise<{
  location: MarketplaceLocation | null;
  needsPicker: boolean;
}> {
  const existing = getMarketplaceLocation();
  if (existing) {
    return { location: existing, needsPicker: false };
  }
  if (hasSeenLocationPrompt()) {
    return { location: null, needsPicker: false };
  }
  return { location: null, needsPicker: true };
}
