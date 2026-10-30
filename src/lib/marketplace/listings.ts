/**
 * Marketplace listing façade — SSOT read/write helpers over properties + listings view.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AssetType, Property, PropertyStatus } from "@/types/database";
import type { MarketplaceListingRow } from "@/lib/search/types";
import { isListingPubliclyActive } from "@/lib/listing-lifecycle";
import type { VehicleCategoryId } from "@/lib/marketplace/vehicle-specs";
import { resolveVehicleCategoryFilter } from "@/lib/marketplace/vehicle-taxonomy";
import type { ElectronicsCategoryId } from "@/lib/marketplace/electronics-specs";
import {
  publicListingAgentSelectWithDiscovery,
  redactListingAgentContact,
  redactListingCollection,
} from "@/lib/marketplace/public-listing-agent";

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
  year: number | null;
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
  if (value === "ELECTRONICS") return "ELECTRONICS";
  return "PROPERTY";
}

const CANONICAL_LISTING_CONDITIONS = new Set([
  "brand_new",
  "open_box",
  "refurbished",
  "foreign_used",
  "nigerian_used",
  "for_parts",
]);

/** Map seller/API vehicle_condition to properties.condition (DB check constraint). */
export function canonicalConditionFromVehicleCondition(
  vehicleCondition: string,
): string {
  const v = vehicleCondition.trim().toLowerCase();
  if (v === "new") return "brand_new";
  if (v === "certified") return "refurbished";
  if (v === "used") return "nigerian_used";
  if (CANONICAL_LISTING_CONDITIONS.has(v)) return v;
  return "foreign_used";
}

export function normalizeListingCondition(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (v === "new") return "brand_new";
  if (v === "certified") return "refurbished";
  if (v === "used") return "nigerian_used";
  return v;
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
    condition: normalizeListingCondition(p.condition ?? p.vehicle_condition),
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

export type ElectronicsListingInput = {
  title: string;
  description?: string;
  price: number;
  state: string;
  city: string;
  area?: string;
  auto_category: ElectronicsCategoryId;
  media_urls?: string[];
  video_url?: string | null;
  brand: string;
  model: string;
  condition: string;
  attributes?: Record<string, unknown>;
};

export type ElectronicsSearchParams = {
  q?: string;
  state?: string;
  city?: string;
  auto_category?: string;
  brand?: string;
  condition?: string;
  min_price?: number;
  max_price?: number;
  featured?: boolean;
  limit?: number;
};

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
  max_operating_hours?: number;
  /** Browse group — road, heavy, agricultural, industrial */
  group?: string;
  featured?: boolean;
  limit?: number;
};

function vehicleListingSelect() {
  return `
  *,
  agent:profiles!properties_agent_id_fkey (
    ${publicListingAgentSelectWithDiscovery()}
  )
`;
}

export async function queryPublicVehicles(
  client: SupabaseClient,
  params: VehicleSearchParams = {},
): Promise<Property[]> {
  const limit = Math.min(Math.max(params.limit ?? 24, 1), 48);
  let query = client
    .from("properties")
    .select(vehicleListingSelect() as "*")
    .eq("asset_type", "VEHICLE")
    .eq("status", "approved")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);

  if (params.featured) query = query.eq("is_featured", true);
  if (params.state) query = query.ilike("state", `%${params.state}%`);
  if (params.city) query = query.ilike("city", `%${params.city}%`);
  const categoryIds = resolveVehicleCategoryFilter({
    category: params.auto_category,
    group: params.group,
  });
  if (categoryIds?.length === 1) {
    query = query.eq("auto_category", categoryIds[0]!);
  } else if (categoryIds && categoryIds.length > 1) {
    query = query.in("auto_category", categoryIds);
  }
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
  if (params.max_operating_hours != null) {
    query = query.lte("attributes->operating_hours", params.max_operating_hours);
  }
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
  return redactListingCollection((data ?? []) as Property[]);
}

/** Publishable listings by id — preserves caller order; omits inactive or missing rows. */
export async function getPublicListingsByIds(
  client: SupabaseClient,
  ids: string[],
): Promise<Property[]> {
  const unique = [...new Set(ids.filter(Boolean))].slice(0, 48);
  if (unique.length === 0) return [];

  const { data, error } = await client
    .from("properties")
    .select(vehicleListingSelect() as "*")
    .in("id", unique)
    .eq("status", "approved")
    .gt("expires_at", new Date().toISOString());

  if (error) {
    console.error("[marketplace] getPublicListingsByIds", error.message);
    return [];
  }

  const byId = new Map(
    ((data ?? []) as Property[])
      .filter((row) => isListingPubliclyActive(row))
      .map((row) => [row.id, row]),
  );

  return redactListingCollection(
    unique
      .map((id) => byId.get(id))
      .filter((row): row is Property => Boolean(row))
  );
}

export async function getVehicleByIdOrSlug(
  client: SupabaseClient,
  idOrSlug: string,
): Promise<Property | null> {
  const byId = await client
    .from("properties")
    .select(vehicleListingSelect() as "*")
    .eq("asset_type", "VEHICLE")
    .eq("id", idOrSlug)
    .maybeSingle();
  if (byId.data) return redactListingAgentContact(byId.data as Property);

  const bySlug = await client
    .from("properties")
    .select(vehicleListingSelect() as "*")
    .eq("asset_type", "VEHICLE")
    .eq("slug", idOrSlug)
    .maybeSingle();
  const row = (bySlug.data as Property | null) ?? null;
  return row ? redactListingAgentContact(row) : null;
}

export async function queryPublicElectronics(
  client: SupabaseClient,
  params: ElectronicsSearchParams = {},
): Promise<Property[]> {
  const limit = Math.min(Math.max(params.limit ?? 24, 1), 48);
  let query = client
    .from("properties")
    .select(vehicleListingSelect() as "*")
    .eq("asset_type", "ELECTRONICS")
    .eq("status", "approved")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);

  if (params.featured) query = query.eq("is_featured", true);
  if (params.state) query = query.ilike("state", `%${params.state}%`);
  if (params.city) query = query.ilike("city", `%${params.city}%`);
  if (params.auto_category) query = query.eq("auto_category", params.auto_category);
  if (params.brand) query = query.ilike("make", `%${params.brand}%`);
  if (params.condition) query = query.eq("condition", params.condition);
  if (params.min_price != null) query = query.gte("price", params.min_price);
  if (params.max_price != null) query = query.lte("price", params.max_price);
  if (params.q) {
    query = query.or(
      `title.ilike.%${params.q}%,description.ilike.%${params.q}%,make.ilike.%${params.q}%,model.ilike.%${params.q}%,city.ilike.%${params.q}%`,
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("[marketplace] queryPublicElectronics", error.message);
    return [];
  }
  return redactListingCollection((data ?? []) as Property[]);
}

export async function getElectronicsByIdOrSlug(
  client: SupabaseClient,
  idOrSlug: string,
): Promise<Property | null> {
  const byId = await client
    .from("properties")
    .select(vehicleListingSelect() as "*")
    .eq("asset_type", "ELECTRONICS")
    .eq("id", idOrSlug)
    .maybeSingle();
  if (byId.data) return redactListingAgentContact(byId.data as Property);

  const bySlug = await client
    .from("properties")
    .select(vehicleListingSelect() as "*")
    .eq("asset_type", "ELECTRONICS")
    .eq("slug", idOrSlug)
    .maybeSingle();
  const row = (bySlug.data as Property | null) ?? null;
  return row ? redactListingAgentContact(row) : null;
}

export function buildElectronicsInsertPayload(
  sellerId: string,
  input: ElectronicsListingInput,
  status: PropertyStatus = "pending",
): Record<string, unknown> {
  const normalizedCondition = normalizeListingCondition(input.condition) ?? input.condition;
  const attributes = {
    ...(input.attributes ?? {}),
    vertical: "electronics",
    auto_category: input.auto_category,
    brand: input.brand.trim(),
  };

  return {
    agent_id: sellerId,
    asset_type: "ELECTRONICS",
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
    make: input.brand.trim(),
    model: input.model.trim(),
    year: null,
    condition: normalizedCondition,
    vehicle_condition: null,
    attributes,
  };
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
    condition: canonicalConditionFromVehicleCondition(input.vehicle_condition),
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
