import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Property } from "@/types/database";
import {
  filterMockListings,
  getMockPropertyById,
  getMockFeatured,
  getMockVerified,
  getRelatedMockListings,
  isDemoProperty,
  MOCK_LISTINGS,
} from "@/lib/mock-listings";
import { mergeQueryIntoParams } from "@/lib/location-search";
import { propertyTypeLabel } from "@/lib/utils";
import { sortPropertiesByMarketRank } from "@/lib/agent-tiers";

import type { DiscoverHub } from "@/types/database";
import { hasAmenity, isTrustVerified, matchesHub } from "@/lib/hub-filters";
import { isHotelPropertyType } from "@/constants/listingTypes";
import type { PropertySearchParams } from "@/lib/property-search";

export type { PropertySearchParams } from "@/lib/property-search";

const PUBLIC_SELECT = `
  *,
  agent:profiles!properties_agent_id_fkey (
    id, full_name, phone, whatsapp, avatar_url,
    verification_status, agent_type, role,
    verified_badge, ranking_score, listing_limit
  )
`;

export async function getPublicProperties(
  params: PropertySearchParams = {},
  limit = 24
): Promise<Property[]> {
  const merged = params.q ? mergeQueryIntoParams(params, params.q) : params;

  if (!isSupabaseConfigured()) {
    return filterMockListings(merged, limit);
  }
  const supabase = await createClient();
  if (!supabase) return filterMockListings(merged, limit);

  let query = supabase
    .from("properties")
    .select(PUBLIC_SELECT)
    .eq("status", "approved")
    .gt("expires_at", new Date().toISOString())
    .order("is_featured", { ascending: false })
    .order("is_verified_listing", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (params.featured) query = query.eq("is_featured", true);
  if (merged.listing_type) query = query.eq("listing_type", merged.listing_type);
  if (merged.state) query = query.ilike("state", `%${merged.state}%`);
  if (merged.city) query = query.ilike("city", `%${merged.city}%`);
  if (merged.area) query = query.ilike("area", `%${merged.area}%`);
  if (merged.bedrooms) query = query.gte("bedrooms", merged.bedrooms);
  if (merged.bathrooms) query = query.gte("bathrooms", merged.bathrooms);
  if (merged.verified_only) query = query.eq("is_verified_listing", true);
  if (merged.property_type)
    query = query.eq("property_type", merged.property_type);
  if (merged.min_price) query = query.gte("price", merged.min_price);
  if (merged.max_price) query = query.lte("price", merged.max_price);
  if (merged.q) {
    query = query.or(
      `title.ilike.%${merged.q}%,area.ilike.%${merged.q}%,city.ilike.%${merged.q}%,description.ilike.%${merged.q}%`
    );
  }

  const { data } = await query;
  let rows = (data ?? []) as Property[];
  if (merged.verified_only) {
    rows = rows.filter((p) => isTrustVerified(p));
  }
  if (merged.hub) {
    rows = rows.filter((p) => matchesHub(p, merged.hub!));
  }
  if (merged.amenity) {
    rows = rows.filter((p) => hasAmenity(p, merged.amenity!));
  }
  if (merged.property_type === "hotel") {
    rows = rows.filter((p) => isHotelPropertyType(p.property_type));
  }
  if (rows.length > 0) {
    return sortPropertiesByMarketRank(rows, merged).slice(0, limit);
  }
  return filterMockListings(merged, limit);
}

export async function getApprovedPropertyIds(limit = 200): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_LISTINGS.map((p) => p.id).slice(0, limit);
  }
  const supabase = await createClient();
  if (!supabase) {
    return MOCK_LISTINGS.map((p) => p.id).slice(0, limit);
  }
  const { data } = await supabase
    .from("properties")
    .select("id")
    .eq("status", "approved")
    .gt("expires_at", new Date().toISOString())
    .order("updated_at", { ascending: false })
    .limit(limit);
  const ids = (data ?? []).map((r) => r.id as string);
  if (ids.length > 0) return ids;
  return MOCK_LISTINGS.map((p) => p.id).slice(0, limit);
}

export async function getFeaturedProperties(limit = 8): Promise<Property[]> {
  if (!isSupabaseConfigured()) return getMockFeatured(limit);
  const rows = await getPublicProperties({ featured: true }, limit);
  return rows.length > 0 ? rows : getMockFeatured(limit);
}

export async function getVerifiedListings(limit = 8): Promise<Property[]> {
  if (!isSupabaseConfigured()) return getMockVerified(limit);
  const supabase = await createClient();
  if (!supabase) return getMockVerified(limit);
  const { data } = await supabase
    .from("properties")
    .select(PUBLIC_SELECT)
    .eq("status", "approved")
    .eq("is_verified_listing", true)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);
  const rows = ((data ?? []) as Property[]).filter((p) => isTrustVerified(p));
  if (rows.length > 0) return rows.slice(0, limit);
  return getMockVerified(limit);
}

export async function getHubListings(
  hub: DiscoverHub,
  limit = 8
): Promise<Property[]> {
  const { getMockByHub } = await import("@/lib/mock-listings");
  if (!isSupabaseConfigured()) return getMockByHub(hub, limit);
  const rows = await getPublicProperties({ hub }, limit);
  return rows.length > 0 ? rows : getMockByHub(hub, limit);
}

export async function getPropertyById(id: string): Promise<Property | null> {
  if (isDemoProperty(id)) return getMockPropertyById(id);

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase
        .from("properties")
        .select(PUBLIC_SELECT)
        .eq("id", id)
        .single();
      if (data) return data as Property;
    }
  }

  return getMockPropertyById(id);
}

export type RelatedSection = {
  title: string;
  subtitle?: string;
  properties: Property[];
};

export async function getRelatedProperties(
  property: Property,
  limit = 6
): Promise<Property[]> {
  if (isDemoProperty(property.id)) {
    return getRelatedMockListings(property, limit);
  }

  if (!isSupabaseConfigured()) {
    return getRelatedMockListings(property, limit);
  }

  const supabase = await createClient();
  if (!supabase) return getRelatedMockListings(property, limit);

  const { data: areaData } = await supabase
    .from("properties")
    .select(PUBLIC_SELECT)
    .eq("status", "approved")
    .eq("city", property.city)
    .eq("area", property.area)
    .neq("id", property.id)
    .gt("expires_at", new Date().toISOString())
    .limit(limit);

  const areaMatches = (areaData ?? []) as Property[];
  if (areaMatches.length >= limit) return areaMatches;

  const { data: cityData } = await supabase
    .from("properties")
    .select(PUBLIC_SELECT)
    .eq("status", "approved")
    .eq("city", property.city)
    .neq("id", property.id)
    .gt("expires_at", new Date().toISOString())
    .limit(limit);

  const cityMatches = (cityData ?? []) as Property[];
  const seen = new Set<string>([property.id]);
  const out: Property[] = [];
  for (const p of [...areaMatches, ...cityMatches]) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      out.push(p);
    }
    if (out.length >= limit) break;
  }

  if (out.length > 0) return out;
  return getRelatedMockListings(property, limit);
}

async function fetchRelatedPool(
  property: Property,
  limit: number
): Promise<Property[]> {
  if (isDemoProperty(property.id) || !isSupabaseConfigured()) {
    return getRelatedMockListings(property, limit * 3);
  }
  const supabase = await createClient();
  if (!supabase) return getRelatedMockListings(property, limit * 3);

  const { data } = await supabase
    .from("properties")
    .select(PUBLIC_SELECT)
    .eq("status", "approved")
    .eq("city", property.city)
    .neq("id", property.id)
    .gt("expires_at", new Date().toISOString())
    .limit(limit * 4);

  const rows = (data ?? []) as Property[];
  if (rows.length > 0) return rows;
  return getRelatedMockListings(property, limit * 3);
}

function priceBand(price: number, pct = 0.35) {
  return {
    min: Math.max(0, price * (1 - pct)),
    max: price * (1 + pct),
  };
}

/** Smart recommendation rails for listing detail — increases session depth. */
export async function getRelatedSections(
  property: Property
): Promise<RelatedSection[]> {
  const pool = await fetchRelatedPool(property, 18);
  const price = Number(property.price);
  const band = priceBand(price);
  const seen = new Set<string>([property.id]);
  const take = (rows: Property[], n: number) => {
    const out: Property[] = [];
    for (const p of rows) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      out.push(p);
      if (out.length >= n) break;
    }
    return out;
  };

  const sameArea = take(
    pool.filter((p) => p.area === property.area),
    4
  );
  const sameType = take(
    pool.filter((p) => p.property_type === property.property_type),
    4
  );
  const samePrice = take(
    pool.filter((p) => {
      const pPrice = Number(p.price);
      return pPrice >= band.min && pPrice <= band.max;
    }),
    4
  );
  const sameListingType = take(
    pool.filter((p) => p.listing_type === property.listing_type),
    4
  );

  const sections: RelatedSection[] = [];

  if (sameArea.length > 0) {
    sections.push({
      title: "More in this neighborhood",
      subtitle: `${property.area}, ${property.city}`,
      properties: sameArea,
    });
  }
  if (sameType.length > 0) {
    sections.push({
      title: `Similar ${propertyTypeLabel(property.property_type).toLowerCase()}s`,
      subtitle: property.city,
      properties: sameType,
    });
  }
  if (samePrice.length > 0 && price > 0) {
    sections.push({
      title: "Similar price range",
      subtitle: "Around what you're viewing",
      properties: samePrice,
    });
  }
  if (sameListingType.length > 0) {
    sections.push({
      title: `More ${property.listing_type} listings`,
      subtitle: property.city,
      properties: sameListingType,
    });
  }

  if (sections.length === 0) {
    const fallback = await getRelatedProperties(property, 6);
    if (fallback.length > 0) {
      sections.push({
        title: "More homes nearby",
        subtitle: `${property.area}, ${property.city}`,
        properties: fallback,
      });
    }
  }

  return sections;
}

export async function incrementPropertyViews(id: string) {
  if (isDemoProperty(id) || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  if (!supabase) return;
  await supabase.rpc("increment_property_views", { property_id: id });
}

export function parseSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): PropertySearchParams {
  const get = (key: string) => {
    const v = searchParams[key];
    return typeof v === "string" ? v : undefined;
  };
  return {
    listing_type: get("type"),
    state: get("state"),
    city: get("city"),
    area: get("area"),
    min_price: get("min") ? Number(get("min")) : undefined,
    max_price: get("max") ? Number(get("max")) : undefined,
    bedrooms: get("beds") ? Number(get("beds")) : undefined,
    bathrooms: get("baths") ? Number(get("baths")) : undefined,
    property_type: get("property_type"),
    q: get("q"),
    featured: get("featured") === "1",
    verified_only: get("verified") === "1",
    hub: get("hub") as DiscoverHub | undefined,
    amenity: get("amenity"),
  };
}

/** Total demo listings count — for empty-state messaging */
export function getDemoListingCount() {
  return MOCK_LISTINGS.length;
}
