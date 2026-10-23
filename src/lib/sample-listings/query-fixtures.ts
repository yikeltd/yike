import type { Property } from "@/types/database";
import { normalizeAssetType } from "@/lib/marketplace/listings";
import { buildSampleListingFixtures } from "./build-rows";
import { isSampleListingFixtureEnabled } from "./flags";

function allSamples(): Property[] {
  if (!isSampleListingFixtureEnabled()) return [];
  return buildSampleListingFixtures();
}

export function getSampleListingBySlugOrId(
  slugOrId: string,
  asset?: "PROPERTY" | "VEHICLE" | "ELECTRONICS",
): Property | null {
  const hit = allSamples().find(
    (p) => p.slug === slugOrId || p.id === slugOrId,
  );
  if (!hit) return null;
  if (asset && normalizeAssetType(hit.asset_type) !== asset) return null;
  return hit;
}

function ilike(hay: string | null | undefined, needle: string | undefined): boolean {
  if (!needle) return true;
  return (hay ?? "").toLowerCase().includes(needle.toLowerCase());
}

export type SampleBrowseFilters = {
  q?: string;
  state?: string;
  city?: string;
  auto_category?: string;
  make?: string;
  brand?: string;
  condition?: string;
  min_price?: number;
  max_price?: number;
  featured?: boolean;
};

function filterSamples(
  asset: "PROPERTY" | "VEHICLE" | "ELECTRONICS",
  filters: SampleBrowseFilters = {},
): Property[] {
  let rows = allSamples().filter((p) => normalizeAssetType(p.asset_type) === asset);

  if (filters.state) {
    rows = rows.filter((p) => ilike(p.state, filters.state));
  }
  if (filters.city) {
    rows = rows.filter((p) => ilike(p.city, filters.city));
  }
  if (filters.auto_category) {
    rows = rows.filter((p) => p.auto_category === filters.auto_category);
  }
  if (filters.make) {
    rows = rows.filter((p) => ilike(p.make, filters.make));
  }
  if (filters.brand) {
    rows = rows.filter((p) => ilike(p.make, filters.brand));
  }
  if (filters.condition) {
    rows = rows.filter(
      (p) =>
        ilike(p.condition, filters.condition) ||
        ilike(p.vehicle_condition, filters.condition),
    );
  }
  if (filters.min_price != null) {
    rows = rows.filter((p) => Number(p.price) >= filters.min_price!);
  }
  if (filters.max_price != null) {
    rows = rows.filter((p) => Number(p.price) <= filters.max_price!);
  }
  if (filters.featured) {
    rows = rows.filter((p) => p.is_featured);
  }
  if (filters.q) {
    const q = filters.q.toLowerCase();
    rows = rows.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.city ?? "").toLowerCase().includes(q) ||
        (p.make ?? "").toLowerCase().includes(q) ||
        (p.model ?? "").toLowerCase().includes(q),
    );
  }

  return rows;
}

/** Use sample catalog when live browse is empty — only if fixture flag is on. */
export function sampleBrowseFallback(
  live: Property[],
  asset: "PROPERTY" | "VEHICLE" | "ELECTRONICS",
  filters: SampleBrowseFilters = {},
): Property[] {
  if (live.length > 0) return live;
  return filterSamples(asset, filters);
}

export function samplePropertyBrowse(filters: SampleBrowseFilters = {}): Property[] {
  return filterSamples("PROPERTY", filters);
}

export function sampleVehicleBrowse(filters: SampleBrowseFilters = {}): Property[] {
  return filterSamples("VEHICLE", filters);
}

export function sampleElectronicsBrowse(filters: SampleBrowseFilters = {}): Property[] {
  return filterSamples("ELECTRONICS", filters);
}
