/**
 * Cross-vertical marketplace search — Property, Vehicle and Electronics in one feed.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Property } from "@/types/database";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import {
  queryPublicElectronics,
  queryPublicVehicles,
  normalizeAssetType,
} from "@/lib/marketplace/listings";
import { getPublicPropertiesStrict } from "@/lib/properties";
import {
  isSampleListingFixtureEnabled,
  isSampleListingFixtureForceEnabled,
} from "@/lib/sample-listings/flags";
import { sampleMixedBrowse } from "@/lib/sample-listings/query-fixtures";

export type MixedMarketplaceSearchParams = {
  q?: string;
  state?: string;
  city?: string;
  min_price?: number;
  max_price?: number;
  limit?: number;
};

function mergeSortByRecency(rows: Property[]): Property[] {
  return [...rows].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

/** Per-vertical fetch budget so merged results are balanced before the global cap. */
function perVerticalLimit(total: number, enabledCount: number): number {
  return Math.max(8, Math.ceil(total / Math.max(1, enabledCount)));
}

export type MixedMarketplaceSearchResult = {
  items: Property[];
  /** True only when explicit dev fixtures were used (never on query error). */
  usedSampleFixture: boolean;
  fetchFailed: boolean;
};

export async function queryMixedMarketplace(
  client: SupabaseClient | null,
  params: MixedMarketplaceSearchParams = {},
): Promise<MixedMarketplaceSearchResult> {
  const limit = Math.min(Math.max(params.limit ?? 24, 1), 48);
  const gates = {
    vehicles: isLaunchFeatureVisible("vehicle_marketplace"),
    electronics: isLaunchFeatureVisible("electronics_marketplace"),
  };
  const enabledCount = 1 + (gates.vehicles ? 1 : 0) + (gates.electronics ? 1 : 0);
  const slice = perVerticalLimit(limit, enabledCount);

  const shared = {
    q: params.q,
    state: params.state,
    city: params.city,
    min_price: params.min_price,
    max_price: params.max_price,
    limit: slice,
  };

  if (!client) {
    return { items: [], usedSampleFixture: false, fetchFailed: true };
  }

  try {
    const [properties, vehicles, electronics] = await Promise.all([
      getPublicPropertiesStrict(
        {
          q: shared.q,
          state: shared.state,
          city: shared.city,
          min_price: shared.min_price,
          max_price: shared.max_price,
        },
        slice,
      ),
      gates.vehicles
        ? queryPublicVehicles(client, shared)
        : Promise.resolve([] as Property[]),
      gates.electronics
        ? queryPublicElectronics(client, shared)
        : Promise.resolve([] as Property[]),
    ]);

    let items = mergeSortByRecency([
      ...properties.filter((p) => normalizeAssetType(p.asset_type) === "PROPERTY"),
      ...vehicles,
      ...electronics,
    ]).slice(0, limit);

    let usedSampleFixture = false;
    const fixtureOn = isSampleListingFixtureEnabled();
    const fixtureForce = isSampleListingFixtureForceEnabled();

    if (fixtureOn && (fixtureForce || items.length === 0)) {
      items = sampleMixedBrowse({
        q: shared.q,
        state: shared.state,
        city: shared.city,
        min_price: shared.min_price,
        max_price: shared.max_price,
      }).slice(0, limit);
      usedSampleFixture = items.length > 0 && (fixtureForce || properties.length + vehicles.length + electronics.length === 0);
    }

    return { items, usedSampleFixture, fetchFailed: false };
  } catch (err) {
    console.error("[mixed-marketplace] query failed", err);
    return { items: [], usedSampleFixture: false, fetchFailed: true };
  }
}
