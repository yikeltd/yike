import type { DiscoverHub } from "@/types/database";

export type PropertySearchParams = {
  listing_type?: string;
  state?: string;
  city?: string;
  area?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  property_type?: string;
  q?: string;
  featured?: boolean;
  verified_only?: boolean;
  bathrooms?: number;
  hub?: DiscoverHub;
  amenity?: string;
};

export function parseSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): PropertySearchParams {
  const get = (key: string) => {
    const v = searchParams[key];
    return typeof v === "string" ? v : undefined;
  };
  return {
    listing_type: get("type") ?? get("listingType"),
    state: get("state"),
    city: get("city"),
    area: get("area"),
    min_price: get("min")
      ? Number(get("min"))
      : get("min_price")
        ? Number(get("min_price"))
        : undefined,
    max_price: get("max")
      ? Number(get("max"))
      : get("max_price")
        ? Number(get("max_price"))
        : undefined,
    bedrooms: get("beds") ? Number(get("beds")) : undefined,
    bathrooms: get("baths") ? Number(get("baths")) : undefined,
    property_type: get("property_type") ?? get("propertyType"),
    q: get("q"),
    featured: get("featured") === "1",
    verified_only: get("verified") === "1",
    hub: get("hub") as DiscoverHub | undefined,
    amenity: get("amenity"),
  };
}
