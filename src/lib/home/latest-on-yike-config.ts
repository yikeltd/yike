import type { AssetType } from "@/types/database";

export const HOMEPAGE_LATEST_ON_YIKE_KEY = "homepage_latest_on_yike";

export type LatestOnYikeMode = "automatic" | "manual";

export type LatestOnYikeCategoryFlags = {
  property: boolean;
  vehicle: boolean;
  electronics: boolean;
};

export type LatestOnYikePerCategoryLimits = {
  property?: number;
  vehicle?: number;
  electronics?: number;
};

export type LatestOnYikeConfig = {
  mode: LatestOnYikeMode;
  enabledCategories: LatestOnYikeCategoryFlags;
  totalLimit: number;
  perCategoryLimits: LatestOnYikePerCategoryLimits;
  /** Manual curation — listing UUIDs in display order. */
  manualListingIds: string[];
};

export const LATEST_ON_YIKE_MAX_TOTAL = 24;
export const LATEST_ON_YIKE_MAX_PER_CATEGORY = 12;

export function getDefaultLatestOnYikeConfig(): LatestOnYikeConfig {
  return {
    mode: "automatic",
    enabledCategories: { property: true, vehicle: true, electronics: true },
    totalLimit: 12,
    perCategoryLimits: {},
    manualListingIds: [],
  };
}

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function parseLatestOnYikeConfig(raw: unknown): LatestOnYikeConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const defaults = getDefaultLatestOnYikeConfig();

  const mode = o.mode === "manual" ? "manual" : "automatic";
  const enabled = o.enabledCategories;
  const enabledCategories: LatestOnYikeCategoryFlags = {
    property:
      enabled && typeof enabled === "object" && "property" in enabled
        ? Boolean((enabled as LatestOnYikeCategoryFlags).property)
        : defaults.enabledCategories.property,
    vehicle:
      enabled && typeof enabled === "object" && "vehicle" in enabled
        ? Boolean((enabled as LatestOnYikeCategoryFlags).vehicle)
        : defaults.enabledCategories.vehicle,
    electronics:
      enabled && typeof enabled === "object" && "electronics" in enabled
        ? Boolean((enabled as LatestOnYikeCategoryFlags).electronics)
        : defaults.enabledCategories.electronics,
  };

  const totalLimit = clampInt(
    Number(o.totalLimit ?? defaults.totalLimit),
    1,
    LATEST_ON_YIKE_MAX_TOTAL,
  );

  const perRaw = o.perCategoryLimits;
  const perCategoryLimits: LatestOnYikePerCategoryLimits = {};
  if (perRaw && typeof perRaw === "object") {
    const p = perRaw as LatestOnYikePerCategoryLimits;
    if (p.property != null) {
      perCategoryLimits.property = clampInt(
        Number(p.property),
        0,
        LATEST_ON_YIKE_MAX_PER_CATEGORY,
      );
    }
    if (p.vehicle != null) {
      perCategoryLimits.vehicle = clampInt(
        Number(p.vehicle),
        0,
        LATEST_ON_YIKE_MAX_PER_CATEGORY,
      );
    }
    if (p.electronics != null) {
      perCategoryLimits.electronics = clampInt(
        Number(p.electronics),
        0,
        LATEST_ON_YIKE_MAX_PER_CATEGORY,
      );
    }
  }

  const manualListingIds = Array.isArray(o.manualListingIds)
    ? o.manualListingIds
        .filter((id): id is string => typeof id === "string" && id.length > 0)
        .slice(0, LATEST_ON_YIKE_MAX_TOTAL)
    : [];

  return {
    mode,
    enabledCategories,
    totalLimit,
    perCategoryLimits,
    manualListingIds,
  };
}

export function mergeLatestOnYikeConfig(
  partial: Partial<LatestOnYikeConfig> | null | undefined,
): LatestOnYikeConfig {
  const defaults = getDefaultLatestOnYikeConfig();
  if (!partial) return defaults;
  return {
    ...defaults,
    ...partial,
    enabledCategories: {
      ...defaults.enabledCategories,
      ...partial.enabledCategories,
    },
    perCategoryLimits: {
      ...defaults.perCategoryLimits,
      ...partial.perCategoryLimits,
    },
    manualListingIds: partial.manualListingIds ?? defaults.manualListingIds,
  };
}

export function enabledAssetTypes(
  flags: LatestOnYikeCategoryFlags,
  gates: { vehicles: boolean; electronics: boolean },
): AssetType[] {
  const out: AssetType[] = [];
  if (flags.property) out.push("PROPERTY");
  if (flags.vehicle && gates.vehicles) out.push("VEHICLE");
  if (flags.electronics && gates.electronics) out.push("ELECTRONICS");
  return out;
}

export function validateLatestOnYikeConfigPatch(
  body: unknown,
): { ok: true; config: LatestOnYikeConfig } | { ok: false; error: string } {
  const parsed = parseLatestOnYikeConfig(body);
  if (!parsed) return { ok: false, error: "Invalid configuration payload" };

  const anyCategory =
    parsed.enabledCategories.property ||
    parsed.enabledCategories.vehicle ||
    parsed.enabledCategories.electronics;
  if (!anyCategory) {
    return { ok: false, error: "Enable at least one category" };
  }

  if (parsed.mode === "manual" && parsed.manualListingIds.length === 0) {
    parsed.mode = "automatic";
  }

  return { ok: true, config: parsed };
}
