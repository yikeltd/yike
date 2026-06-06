import { cookies } from "next/headers";
import type { PropertySearchParams } from "@/lib/properties";

export async function getServerSearchPreferences(): Promise<
  Partial<PropertySearchParams>
> {
  const jar = await cookies();
  const city = jar.get("yike_pref_city")?.value;
  const area = jar.get("yike_pref_area")?.value;
  const listingType = jar.get("yike_pref_type")?.value;

  return {
    ...(city ? { city: decodeURIComponent(city) } : {}),
    ...(area ? { area: decodeURIComponent(area) } : {}),
    ...(listingType ? { listing_type: decodeURIComponent(listingType) } : {}),
  };
}
