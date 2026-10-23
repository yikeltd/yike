import type { Property } from "@/types/database";
import { isListingPubliclyActive } from "@/lib/listing-lifecycle";
import { normalizeAssetType } from "@/lib/marketplace/listings";
import { buildSampleListingFixtures } from "@/lib/sample-listings/build-rows";
import type { LatestOnYikeConfig } from "./latest-on-yike-config";
import { enabledAssetTypes } from "./latest-on-yike-config";

export type LatestOnYikeFeedInput = {
  config: LatestOnYikeConfig;
  livePools: {
    property: Property[];
    vehicle: Property[];
    electronics: Property[];
  };
  manualResolved: Property[];
  gates: { vehicles: boolean; electronics: boolean };
  sampleFixtureMode?: boolean;
  fetchFailed?: boolean;
};

export type LatestOnYikeFeedResult = {
  items: Property[];
  usedSampleFixture: boolean;
  unavailableManualCount: number;
  error: boolean;
};

function publishable(listing: Property): boolean {
  return isListingPubliclyActive(listing);
}

function perCategoryLimit(
  config: LatestOnYikeConfig,
  asset: "PROPERTY" | "VEHICLE" | "ELECTRONICS",
  enabledCount: number,
): number {
  const key =
    asset === "PROPERTY"
      ? "property"
      : asset === "VEHICLE"
        ? "vehicle"
        : "electronics";
  const explicit = config.perCategoryLimits[key];
  if (explicit != null && explicit > 0) return explicit;
  return Math.max(1, Math.ceil(config.totalLimit / Math.max(1, enabledCount)));
}

function automaticFromPools(input: LatestOnYikeFeedInput): Property[] {
  const { config, livePools, gates } = input;
  const assets = enabledAssetTypes(config.enabledCategories, gates);
  if (assets.length === 0) return [];

  const slices: Property[] = [];
  for (const asset of assets) {
    const pool =
      asset === "PROPERTY"
        ? livePools.property
        : asset === "VEHICLE"
          ? livePools.vehicle
          : livePools.electronics;
    const limit = perCategoryLimit(config, asset, assets.length);
    slices.push(
      ...pool
        .filter((p) => publishable(p) && normalizeAssetType(p.asset_type) === asset)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, limit),
    );
  }

  return slices
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, config.totalLimit);
}

function manualFromResolved(input: LatestOnYikeFeedInput): {
  items: Property[];
  unavailableManualCount: number;
} {
  const { config, manualResolved, gates } = input;
  const allowed = new Set(
    enabledAssetTypes(config.enabledCategories, gates).map((a) => a),
  );

  const items: Property[] = [];
  let unavailableManualCount = 0;
  for (const id of config.manualListingIds) {
    const hit = manualResolved.find((p) => p.id === id);
    if (!hit || !publishable(hit)) {
      unavailableManualCount += 1;
      continue;
    }
    const asset = normalizeAssetType(hit.asset_type);
    if (!allowed.has(asset)) continue;
    items.push(hit);
    if (items.length >= config.totalLimit) break;
  }
  return { items, unavailableManualCount };
}

function sampleFixtureFeed(input: LatestOnYikeFeedInput): Property[] {
  const { config, gates } = input;
  const allowed = enabledAssetTypes(config.enabledCategories, gates);
  const catalog = buildSampleListingFixtures().filter((p) =>
    allowed.includes(normalizeAssetType(p.asset_type)),
  );

  if (input.config.mode === "manual" && input.config.manualListingIds.length > 0) {
    const byId = new Map(catalog.map((p) => [p.id, p]));
    const ordered = input.config.manualListingIds
      .map((id) => byId.get(id))
      .filter(Boolean) as Property[];
    return ordered.slice(0, config.totalLimit);
  }

  const byAsset: Property[] = [];
  for (const asset of allowed) {
    const limit = perCategoryLimit(config, asset, allowed.length);
    byAsset.push(
      ...catalog
        .filter((p) => normalizeAssetType(p.asset_type) === asset)
        .slice(0, limit),
    );
  }
  return byAsset
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, config.totalLimit);
}

/** Pure feed assembly — DB fetch happens in server module. */
export function buildLatestOnYikeFeed(
  input: LatestOnYikeFeedInput,
): LatestOnYikeFeedResult {
  if (input.fetchFailed) {
    return {
      items: [],
      usedSampleFixture: false,
      unavailableManualCount: 0,
      error: true,
    };
  }

  let items: Property[] = [];
  let unavailableManualCount = 0;

  if (input.config.mode === "manual" && input.config.manualListingIds.length > 0) {
    const manual = manualFromResolved(input);
    items = manual.items;
    unavailableManualCount = manual.unavailableManualCount;
  } else {
    items = automaticFromPools(input);
  }

  if (items.length > 0) {
    return {
      items,
      usedSampleFixture: false,
      unavailableManualCount,
      error: false,
    };
  }

  if (input.sampleFixtureMode) {
    return {
      items: sampleFixtureFeed(input),
      usedSampleFixture: true,
      unavailableManualCount,
      error: false,
    };
  }

  return {
    items: [],
    usedSampleFixture: false,
    unavailableManualCount,
    error: false,
  };
}
