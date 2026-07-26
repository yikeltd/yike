/**
 * Marketplace listing façade — SSOT read/write helpers over properties + listings view.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AssetType, Property, PropertyStatus } from "@/types/database";
import type { MarketplaceListingRow } from "@/lib/search/types";
import type { VehicleCategoryId } from "@/lib/marketplace/vehicle-specs";

export type ListingIntent = "sale" | "rent" | "lease" | "shortlet";

export type VehicleListingInput = {
  title: string;
  description?: string;
  price: number;
  state: string;
  city: string;
  area?: string;
  auto_category: VehicleCategoryId;
  media_urls?: string[];
  video_url?: string | null;
  make: string;
  model: string;
  year: number;
  trim?: string | null;
  transmission?: string | null;
  fuel_type?: string | null;
  mileage?: number | null;
  vehicle_condition: string;
  vin?: string | null;
  exterior_color?: string | null;
  interior_color?: string | null;
  body_type?: string | null;
  drivetrain?: string | null;
  engine?: string | null;
  registration_status?: string | null;
  financing_available?: boolean;
  attributes?: Record<string, unknown>;
};

export function normalizeAssetType(
  value: string | null | undefined,
): AssetType {
  if (value === "VEHICLE" || value === "AUTO") return "VEHICLE";
  return "PROPERTY";
}

export function propertyToListingRow(p: Property): MarketplaceListingRow {
  return {
    id: p.id,
    title: p.title,
    description: p.description ?? undefined,
    price: p.price,
    asset_type: normalizeAssetType(p.asset_type),
    property_category: p.property_type,
    auto_category: p.auto_category ?? null,
    condition: p.vehicle_condition ?? null,
    verification_status: p.is_verified_listing ? "verified" : "unverified",
    state: p.state,
    city: p.city,
    images: p.media_urls,
    attributes: p.attributes ?? {},
    moderation_status: p.status,
    is_active: p.status === "approved",
    is_featured: p.is_featured,
    vendor_id: p.agent_id,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

export type VehicleSearchParams = {
  q?: string;
  state?: string;
  city?: string;
  auto_category?: string;
  make?: string;
  model?: string;
  min_year?: number;
  max_year?: number;
  min_price?: number;
  max_price?: number;
  transmission?: string;
  fuel_type?: string;
  condition?: string;
  min_mileage?: number;
  max_mileage?: number;
  featured?: boolean;
  limit?: number;
};

const VEHICLE_SELECT = `
  *,
  agent:profiles!properties_agent_id_fkey (
    id, full_name, phone, whatsapp, avatar_url,
    verification_status, agent_type, role, account_type,
    verified_badge, ranking_score, is_verified_agent,
    company_name, public_slug, created_at, listing_limit
  )
`;

export async function queryPublicVehicles(
  client: SupabaseClient,
  params: VehicleSearchParams = {},
): Promise<Property[]> {
  const limit = Math.min(Math.max(params.limit ?? 24, 1), 48);
  let query = client
    .from("properties")
    .select(VEHICLE_SELECT)
    .eq("asset_type", "VEHICLE")
    .eq("status", "approved")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);

  if (params.featured) query = query.eq("is_featured", true);
  if (params.state) query = query.ilike("state", `%${params.state}%`);
  if (params.city) query = query.ilike("city", `%${params.city}%`);
  if (params.auto_category) query = query.eq("auto_category", params.auto_category);
  if (params.make) query = query.ilike("make", `%${params.make}%`);
  if (params.model) query = query.ilike("model", `%${params.model}%`);
  if (params.min_year != null) query = query.gte("year", params.min_year);
  if (params.max_year != null) query = query.lte("year", params.max_year);
  if (params.min_price != null) query = query.gte("price", params.min_price);
  if (params.max_price != null) query = query.lte("price", params.max_price);
  if (params.transmission) query = query.eq("transmission", params.transmission);
  if (params.fuel_type) query = query.eq("fuel_type", params.fuel_type);
  if (params.condition) query = query.eq("vehicle_condition", params.condition);
  if (params.min_mileage != null) query = query.gte("mileage", params.min_mileage);
  if (params.max_mileage != null) query = query.lte("mileage", params.max_mileage);
  if (params.q) {
    query = query.or(
      `title.ilike.%${params.q}%,description.ilike.%${params.q}%,make.ilike.%${params.q}%,model.ilike.%${params.q}%,city.ilike.%${params.q}%`,
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("[marketplace] queryPublicVehicles", error.message);
    return [];
  }
  return (data ?? []) as Property[];
}

export async function getVehicleByIdOrSlug(
  client: SupabaseClient,
  idOrSlug: string,
): Promise<Property | null> {
  const byId = await client
    .from("properties")
    .select(VEHICLE_SELECT)
    .eq("asset_type", "VEHICLE")
    .eq("id", idOrSlug)
    .maybeSingle();
  if (byId.data) return byId.data as Property;

  const bySlug = await client
    .from("properties")
    .select(VEHICLE_SELECT)
    .eq("asset_type", "VEHICLE")
    .eq("slug", idOrSlug)
    .maybeSingle();
  return (bySlug.data as Property | null) ?? null;
}

export function buildVehicleInsertPayload(
  sellerId: string,
  input: VehicleListingInput,
  status: PropertyStatus = "pending",
): Record<string, unknown> {
  const attributes = {
    ...(input.attributes ?? {}),
    vertical: "vehicle",
    auto_category: input.auto_category,
  };

  return {
    agent_id: sellerId,
    asset_type: "VEHICLE",
    title: input.title.trim(),
    description: input.description?.trim() || null,
    price: input.price,
    listing_type: "sale",
    property_type: null,
    bedrooms: 0,
    bathrooms: 0,
    toilets: 0,
    payment_period: "total",
    state: input.state.trim(),
    city: input.city.trim(),
    area: (input.area ?? input.city).trim(),
    media_urls: input.media_urls ?? [],
    video_url: input.video_url ?? null,
    status,
    auto_category: input.auto_category,
    make: input.make.trim(),
    model: input.model.trim(),
    year: input.year,
    trim: input.trim ?? null,
    transmission: input.transmission ?? null,
    fuel_type: input.fuel_type ?? null,
    mileage: input.mileage ?? null,
    vehicle_condition: input.vehicle_condition,
    vin: input.vin ?? null,
    exterior_color: input.exterior_color ?? null,
    interior_color: input.interior_color ?? null,
    body_type: input.body_type ?? null,
    drivetrain: input.drivetrain ?? null,
    engine: input.engine ?? null,
    registration_status: input.registration_status ?? null,
    financing_available: Boolean(input.financing_available),
    attributes,
  };
}
