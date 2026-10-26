import type { Property } from "@/types/database";
import {
  SAMPLE_ELECTRONICS,
  SAMPLE_LISTINGS_NAMESPACE,
  SAMPLE_PROPERTIES,
  SAMPLE_VEHICLES,
} from "./catalog";
import { getSampleAgentProfile } from "./agent-fixtures";

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

function seedAttributes(extra: Record<string, unknown> = {}) {
  return {
    is_demo: true,
    is_sample: true,
    seed_namespace: SAMPLE_LISTINGS_NAMESPACE,
    demo_media: true,
    ...extra,
  };
}

export function buildSamplePropertyDbRows() {
  return SAMPLE_PROPERTIES.map((p) => ({
    id: p.id,
    slug: p.slug,
    agent_id: p.sellerId,
    asset_type: "PROPERTY" as const,
    title: p.title,
    description: p.description,
    listing_type: p.listing_type,
    property_type: p.property_type,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    toilets: p.bathrooms,
    price: p.price,
    payment_period: p.payment_period,
    state: p.state,
    city: p.city,
    area: p.area,
    address_hint: p.area,
    landmark: null,
    media_urls: p.images,
    media_items: p.images.map((url, i) => ({
      id: `${p.id}-media-${i}`,
      image_url: url,
      sort_order: i,
      is_cover: i === 0,
    })),
    video_url: null,
    status: "approved" as const,
    is_featured: Boolean(p.featured),
    featured_until: p.featured ? daysFromNow(30) : null,
    is_verified_listing: true,
    views_count: 12,
    contact_clicks: 1,
    expires_at: daysFromNow(120),
    published_at: new Date().toISOString(),
    extras: {},
    attributes: seedAttributes({ vertical: "property" }),
    financing_available: false,
    is_boosted: false,
    boosted_until: null,
  }));
}

export function buildSampleVehicleDbRows() {
  return SAMPLE_VEHICLES.map((v) => ({
    id: v.id,
    slug: v.slug,
    agent_id: v.sellerId,
    asset_type: "VEHICLE" as const,
    title: v.title,
    description: v.description,
    listing_type: "sale" as const,
    property_type: null,
    bedrooms: 0,
    bathrooms: 0,
    toilets: 0,
    price: v.price,
    payment_period: "total" as const,
    state: v.state,
    city: v.city,
    area: v.area,
    media_urls: v.images,
    media_items: v.images.map((url, i) => ({
      id: `${v.id}-media-${i}`,
      image_url: url,
      sort_order: i,
      is_cover: i === 0,
    })),
    status: "approved" as const,
    is_featured: Boolean(v.featured),
    featured_until: v.featured ? daysFromNow(30) : null,
    expires_at: daysFromNow(120),
    published_at: new Date().toISOString(),
    auto_category: v.auto_category,
    make: v.make,
    model: v.model,
    year: v.year,
    transmission: v.transmission,
    fuel_type: v.fuel_type,
    mileage: v.mileage,
    vehicle_condition: v.vehicle_condition,
    attributes: {
      ...seedAttributes({ vertical: "vehicle" }),
      ...(v.attributes ?? {}),
    },
    extras: {},
    financing_available: false,
    is_boosted: false,
  }));
}

export function buildSampleElectronicsDbRows() {
  return SAMPLE_ELECTRONICS.map((e) => ({
    id: e.id,
    slug: e.slug,
    agent_id: e.sellerId,
    asset_type: "ELECTRONICS" as const,
    title: e.title,
    description: e.description,
    listing_type: "sale" as const,
    property_type: null,
    bedrooms: 0,
    bathrooms: 0,
    toilets: 0,
    price: e.price,
    payment_period: "total" as const,
    state: e.state,
    city: e.city,
    area: e.area,
    media_urls: e.images,
    media_items: e.images.map((url, i) => ({
      id: `${e.id}-media-${i}`,
      image_url: url,
      sort_order: i,
      is_cover: i === 0,
    })),
    status: "approved" as const,
    is_featured: Boolean(e.featured),
    featured_until: e.featured ? daysFromNow(30) : null,
    expires_at: daysFromNow(120),
    published_at: new Date().toISOString(),
    auto_category: e.auto_category,
    make: e.brand,
    model: e.model,
    condition: e.condition,
    vehicle_condition: null,
    attributes: seedAttributes({
      vertical: "electronics",
      auto_category: e.auto_category,
      brand: e.brand,
      ...e.attributes,
    }),
    extras: {},
    financing_available: false,
    is_boosted: false,
  }));
}

export function buildAllSampleDbRows() {
  return [
    ...buildSamplePropertyDbRows(),
    ...buildSampleVehicleDbRows(),
    ...buildSampleElectronicsDbRows(),
  ];
}

/** Dev fixture shape for homepage / browse (explicit flag only). */
export function buildSampleListingFixtures(): Property[] {
  const rows = buildAllSampleDbRows();
  return rows.map(
    (row, index) =>
      ({
        ...row,
        created_at: new Date(Date.now() - index * 3_600_000).toISOString(),
        updated_at: new Date(Date.now() - index * 3_600_000).toISOString(),
        agent: getSampleAgentProfile(row.agent_id),
      }) as unknown as Property,
  );
}
