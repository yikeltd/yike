import type { SupabaseClient } from "@supabase/supabase-js";
import type { Property } from "@/types/database";
import { createVerifiedAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import {
  getPublicListingsByIds,
  queryPublicElectronics,
  queryPublicVehicles,
} from "@/lib/marketplace/listings";
import { getPublicProperties } from "@/lib/properties";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import {
  getDefaultLatestOnYikeConfig,
  HOMEPAGE_LATEST_ON_YIKE_KEY,
  mergeLatestOnYikeConfig,
  parseLatestOnYikeConfig,
  type LatestOnYikeConfig,
} from "./latest-on-yike-config";
import {
  buildLatestOnYikeFeed,
  type LatestOnYikeFeedResult,
} from "./latest-on-yike-feed";

export async function getLatestOnYikeConfig(): Promise<LatestOnYikeConfig> {
  if (!isAdminClientConfigured()) return getDefaultLatestOnYikeConfig();
  const supabase = await createVerifiedAdminClient();
  if (!supabase) return getDefaultLatestOnYikeConfig();

  const { data } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", HOMEPAGE_LATEST_ON_YIKE_KEY)
    .maybeSingle();

  const parsed = parseLatestOnYikeConfig(data?.value ?? null);
  return mergeLatestOnYikeConfig(parsed);
}

export async function setLatestOnYikeConfig(
  config: LatestOnYikeConfig,
  updatedBy: string,
): Promise<void> {
  const supabase = await createVerifiedAdminClient();
  if (!supabase) throw new Error("Database unavailable");

  await supabase.from("platform_settings").upsert({
    key: HOMEPAGE_LATEST_ON_YIKE_KEY,
    value: config,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  });
}

export async function resolveLatestOnYikeFeed(options: {
  supabase: SupabaseClient | null;
  fetchFailed: boolean;
  sampleFixtureMode: boolean;
}): Promise<LatestOnYikeFeedResult> {
  const config = await getLatestOnYikeConfig();
  const gates = {
    vehicles: isLaunchFeatureVisible("vehicle_marketplace"),
    electronics: isLaunchFeatureVisible("electronics_marketplace"),
  };

  if (options.fetchFailed || !options.supabase) {
    return buildLatestOnYikeFeed({
      config,
      livePools: { property: [], vehicle: [], electronics: [] },
      manualResolved: [],
      gates,
      sampleFixtureMode: options.sampleFixtureMode,
      fetchFailed: true,
    });
  }

  const client = options.supabase;
  const perCat = Math.max(config.totalLimit, 12);

  const [propertyPool, vehiclePool, electronicsPool, manualResolved] =
    await Promise.all([
      getPublicProperties({}, perCat * 2),
      gates.vehicles
        ? queryPublicVehicles(client, { limit: perCat * 2 })
        : Promise.resolve([] as Property[]),
      gates.electronics
        ? queryPublicElectronics(client, { limit: perCat * 2 })
        : Promise.resolve([] as Property[]),
      config.mode === "manual" && config.manualListingIds.length > 0
        ? getPublicListingsByIds(client, config.manualListingIds)
        : Promise.resolve([] as Property[]),
    ]);

  return buildLatestOnYikeFeed({
    config,
    livePools: {
      property: propertyPool,
      vehicle: vehiclePool,
      electronics: electronicsPool,
    },
    manualResolved,
    gates,
    sampleFixtureMode: options.sampleFixtureMode,
    fetchFailed: false,
  });
}
