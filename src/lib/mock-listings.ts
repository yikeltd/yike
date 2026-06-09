import type { Profile, Property } from "@/types/database";
import type { PropertySearchParams } from "@/lib/properties";
import { mergeQueryIntoParams } from "@/lib/location-search";
import { buildMockListings } from "@/lib/mock-listings-seed";
import { buildPropertySlugBase } from "@/lib/property-slugs";
import { hasAmenity, isTrustVerified, matchesHub } from "@/lib/hub-filters";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isProductionEnv } from "@/lib/env";

export const MOCK_LISTINGS: Property[] = buildMockListings().map((p) => ({
  ...p,
  slug: buildPropertySlugBase(p),
  slug_locked: false,
  seo_title: null,
  seo_description: null,
}));

export function isDemoProperty(id: string) {
  return id.startsWith("demo-");
}

export function getMockPropertyById(id: string): Property | null {
  return MOCK_LISTINGS.find((p) => p.id === id) ?? null;
}

function matchesSearch(p: Property, params: PropertySearchParams): boolean {
  if (params.featured && !p.is_featured) return false;
  if (params.listing_type && p.listing_type !== params.listing_type) return false;
  if (params.property_type && p.property_type !== params.property_type) return false;
  if (params.bedrooms && p.bedrooms < params.bedrooms) return false;
  if (params.bathrooms && p.bathrooms < params.bathrooms) return false;
  if (params.verified_only && !isTrustVerified(p)) return false;
  if (params.hub && !matchesHub(p, params.hub)) return false;
  if (params.amenity && !hasAmenity(p, params.amenity)) return false;
  if (params.state && !p.state.toLowerCase().includes(params.state.toLowerCase()))
    return false;
  if (params.min_price && Number(p.price) < params.min_price) return false;
  if (params.max_price && Number(p.price) > params.max_price) return false;

  if (params.city) {
    const city = params.city.toLowerCase();
    const matchCity =
      p.city.toLowerCase().includes(city) ||
      p.area.toLowerCase().includes(city);
    if (!matchCity) return false;
  }

  if (params.area) {
    const area = params.area.toLowerCase();
    if (
      !p.area.toLowerCase().includes(area) &&
      !p.city.toLowerCase().includes(area)
    ) {
      return false;
    }
  }

  if (params.q) {
    const q = params.q.toLowerCase();
    const blob = `${p.title} ${p.area} ${p.city} ${p.description ?? ""}`.toLowerCase();
    if (!blob.includes(q)) return false;
  }

  return true;
}

export function filterMockListings(
  params: PropertySearchParams = {},
  limit = 48
): Property[] {
  const merged = params.q
    ? mergeQueryIntoParams(params, params.q)
    : params;

  return MOCK_LISTINGS.filter((p) => matchesSearch(p, merged))
    .sort((a, b) => {
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      if (isTrustVerified(a) !== isTrustVerified(b))
        return isTrustVerified(a) ? -1 : 1;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    })
    .slice(0, limit);
}

export function getMockFeatured(limit = 8): Property[] {
  return filterMockListings({ featured: true }, limit);
}

export function getMockVerified(limit = 8): Property[] {
  return MOCK_LISTINGS.filter((p) => isTrustVerified(p))
    .sort((a, b) => b.views_count - a.views_count)
    .slice(0, limit);
}

export function getMockByHub(
  hub: NonNullable<PropertySearchParams["hub"]>,
  limit = 8
): Property[] {
  return filterMockListings({ hub }, limit);
}

export function getRelatedMockListings(
  property: Property,
  limit = 6
): Property[] {
  const sameArea = MOCK_LISTINGS.filter(
    (p) =>
      p.id !== property.id &&
      p.area === property.area &&
      p.city === property.city
  );
  if (sameArea.length >= limit) return sameArea.slice(0, limit);

  const sameCity = MOCK_LISTINGS.filter(
    (p) =>
      p.id !== property.id &&
      p.city === property.city &&
      p.area !== property.area
  );
  const merged = [...sameArea, ...sameCity];
  const seen = new Set<string>();
  const out: Property[] = [];
  for (const p of merged) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      out.push(p);
    }
    if (out.length >= limit) break;
  }
  return out;
}

export function getMockAgentById(id: string): Profile | null {
  for (const p of MOCK_LISTINGS) {
    if (p.agent_id === id && p.agent) return p.agent;
    if (p.agent?.id === id) return p.agent;
  }
  return null;
}

export function getMockListingsByAgent(
  agentId: string,
  limit = 48
): Property[] {
  return MOCK_LISTINGS.filter(
    (p) => p.agent_id === agentId || p.agent?.id === agentId
  ).slice(0, limit);
}

export function withDemoFallback(
  properties: Property[],
  options?: { allowEmpty?: boolean }
): {
  items: Property[];
  isDemo: boolean;
} {
  if (properties.length > 0) {
    return {
      items: properties,
      isDemo: properties.every((p) => isDemoProperty(p.id)),
    };
  }
  if (options?.allowEmpty || isProductionEnv() || isSupabaseConfigured()) {
    return { items: [], isDemo: false };
  }
  return { items: MOCK_LISTINGS.slice(0, 24), isDemo: true };
}
