/**
 * Distance helpers for browse cards.
 * Listings have no lat/lng columns yet — we approximate via city centroids
 * when the user has GPS (or city centroid from preferred location).
 */

import {
  haversineKm,
  resolveCityCentroid,
} from "./centroids";
import type { MarketplaceLocation } from "./types";

export function formatDistanceKm(km: number): string {
  if (!Number.isFinite(km) || km < 0) return "";
  if (km < 1) return "~1 km";
  if (km < 10) return `~${Math.round(km)} km`;
  if (km < 100) return `~${Math.round(km / 5) * 5} km`;
  return `~${Math.round(km / 10) * 10} km`;
}

/**
 * Distance from user origin to listing city centroid.
 * Returns null when either side lacks coordinates.
 */
export function listingDistanceKm(
  listing: { city?: string | null; state?: string | null },
  origin: Pick<MarketplaceLocation, "lat" | "lng" | "city" | "state"> | null,
): number | null {
  if (!origin) return null;

  let oLat = origin.lat;
  let oLng = origin.lng;
  if (oLat == null || oLng == null) {
    const oc = resolveCityCentroid(origin.city, origin.state);
    if (!oc) return null;
    oLat = oc.lat;
    oLng = oc.lng;
  }

  const listingCentroid = resolveCityCentroid(listing.city, listing.state);
  if (!listingCentroid) return null;

  // Same city → show small local distance (not 0) for honesty of city-level approx
  if (
    listing.city &&
    origin.city &&
    listing.city.toLowerCase() === origin.city.toLowerCase()
  ) {
    return Math.max(2, haversineKm(oLat, oLng, listingCentroid.lat, listingCentroid.lng) || 2);
  }

  return haversineKm(oLat, oLng, listingCentroid.lat, listingCentroid.lng);
}

export function listingDistanceLabel(
  listing: { city?: string | null; state?: string | null },
  origin: Pick<MarketplaceLocation, "lat" | "lng" | "city" | "state"> | null,
): string | null {
  const km = listingDistanceKm(listing, origin);
  if (km == null) return null;
  return formatDistanceKm(km);
}
