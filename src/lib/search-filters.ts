import type { PropertySearchParams } from "@/lib/properties";

export type SearchFilterState = PropertySearchParams;

export const BEDROOM_OPTIONS = [
  { value: "", label: "Any beds" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
] as const;

export const BATHROOM_OPTIONS = [
  { value: "", label: "Any baths" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
] as const;

export function filtersToSearchParams(
  filters: SearchFilterState
): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.listing_type) p.set("type", filters.listing_type);
  if (filters.state) p.set("state", filters.state);
  if (filters.city) p.set("city", filters.city);
  if (filters.area) p.set("area", filters.area);
  if (filters.property_type) p.set("property_type", filters.property_type);
  if (filters.min_price) p.set("min", String(filters.min_price));
  if (filters.max_price) p.set("max", String(filters.max_price));
  if (filters.bedrooms) p.set("beds", String(filters.bedrooms));
  if (filters.bathrooms) p.set("baths", String(filters.bathrooms));
  if (filters.featured) p.set("featured", "1");
  if (filters.verified_only) p.set("verified", "1");
  if (filters.hub) p.set("hub", filters.hub);
  if (filters.amenity) p.set("amenity", filters.amenity);
  if (filters.q) p.set("q", filters.q);
  return p;
}

export function hasActiveFilters(params: SearchFilterState): boolean {
  return Boolean(
    params.state ||
      params.city ||
      params.area ||
      params.listing_type ||
      params.property_type ||
      params.min_price ||
      params.max_price ||
      params.bedrooms ||
      params.bathrooms ||
      params.featured ||
      params.verified_only ||
      params.hub ||
      params.amenity ||
      params.q
  );
}
