import { cookies } from "next/headers";
import type { PropertySearchParams } from "@/lib/properties";
import type { MarketplaceLocation } from "@/lib/marketplace-location/types";

export async function getServerSearchPreferences(): Promise<
  Partial<PropertySearchParams>
> {
  const jar = await cookies();
  const city = jar.get("yike_pref_city")?.value;
  const area = jar.get("yike_pref_area")?.value;
  const listingType = jar.get("yike_pref_type")?.value;
  const state = jar.get("yike_pref_state")?.value;

  return {
    ...(city ? { city: decodeURIComponent(city) } : {}),
    ...(area ? { area: decodeURIComponent(area) } : {}),
    ...(state ? { state: decodeURIComponent(state) } : {}),
    ...(listingType ? { listing_type: decodeURIComponent(listingType) } : {}),
  };
}

/** Full marketplace location from preference cookies (server). */
export async function getServerMarketplaceLocation(): Promise<MarketplaceLocation | null> {
  const jar = await cookies();
  const city = jar.get("yike_pref_city")?.value;
  const state = jar.get("yike_pref_state")?.value;
  const area = jar.get("yike_pref_area")?.value;
  const latRaw = jar.get("yike_pref_lat")?.value;
  const lngRaw = jar.get("yike_pref_lng")?.value;

  const decodedCity = city ? decodeURIComponent(city) : "";
  const decodedState = state ? decodeURIComponent(state) : "";
  if (!decodedCity && !decodedState) return null;

  const lat = latRaw ? Number(decodeURIComponent(latRaw)) : undefined;
  const lng = lngRaw ? Number(decodeURIComponent(lngRaw)) : undefined;

  return {
    city: decodedCity,
    state: decodedState,
    area: area ? decodeURIComponent(area) : undefined,
    lat: lat != null && Number.isFinite(lat) ? lat : undefined,
    lng: lng != null && Number.isFinite(lng) ? lng : undefined,
    source: "cookie",
    updatedAt: 0,
  };
}
