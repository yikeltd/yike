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
