/**
 * Launch / ecosystem feature visibility registry.
 *
 * Prefer isLaunchFeatureVisible() over ad-hoc env checks for deferred surfaces.
 * Vehicle Marketplace must stay hidden until Security + Constitutional + Passport
 * prep are complete (approved audit sequencing).
 *
 * YIKE_LAUNCH_MODE=true (default in production posture) keeps deferred features off.
 * Per-feature env overrides can enable a single surface when explicitly authorized.
 */

import { isProductionEnv } from "@/lib/env";

export type LaunchFeature =
  | "vehicle_marketplace"
  | "industrial_marketplace"
  | "hospitality_listings"
  | "business_listings"
  | "auction_services"
  | "passport_ui"
  | "wallet"
  | "escrow"
  | "developer_api"
  | "command_center_consumer"
  | "workforce_consumer"
  | "mortgage_insurance_ui"
  | "national_registry_ui"
  | "trust_economy_ui";

const FEATURE_ENV: Partial<Record<LaunchFeature, string>> = {
  vehicle_marketplace: "ENABLE_VEHICLE_MARKETPLACE",
  industrial_marketplace: "ENABLE_INDUSTRIAL_MARKETPLACE",
  hospitality_listings: "ENABLE_HOSPITALITY_LISTINGS",
  business_listings: "ENABLE_BUSINESS_LISTINGS",
  auction_services: "ENABLE_AUCTION_SERVICES",
  passport_ui: "ENABLE_PASSPORT_UI",
  wallet: "ENABLE_WALLET",
  escrow: "ENABLE_ESCROW",
  developer_api: "ENABLE_DEVELOPER_API",
  command_center_consumer: "ENABLE_COMMAND_CENTER_CONSUMER",
  workforce_consumer: "ENABLE_WORKFORCE_CONSUMER",
  mortgage_insurance_ui: "ENABLE_MORTGAGE_INSURANCE_UI",
  national_registry_ui: "ENABLE_NATIONAL_REGISTRY_UI",
  trust_economy_ui: "ENABLE_TRUST_ECONOMY_UI",
};

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return defaultValue;
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return defaultValue;
}

/**
 * When true (default), deferred launch features stay hidden unless a
 * per-feature ENABLE_* override is set.
 *
 * Vehicle marketplace defaults ON for Enterprise Marketplace launch unless
 * ENABLE_VEHICLE_MARKETPLACE=false.
 */
export function isLaunchModeStrict(): boolean {
  const raw = process.env.YIKE_LAUNCH_MODE?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "no") return false;
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  return isProductionEnv();
}

/** Whether a deferred / ecosystem-gated feature may surface in product UI. */
export function isLaunchFeatureVisible(feature: LaunchFeature): boolean {
  const envName = FEATURE_ENV[feature];

  // Vehicle marketplace: default enabled for marketplace launch completion.
  if (feature === "vehicle_marketplace") {
    if (envName && process.env[envName]?.trim()) {
      return envFlag(envName, true);
    }
    return envFlag("ENABLE_VEHICLE_MARKETPLACE", true);
  }

  if (envName && envFlag(envName, false)) return true;
  if (!isLaunchModeStrict()) {
    return false;
  }
  return false;
}

export const LAUNCH_DEFERRED_FEATURES: LaunchFeature[] = [
  "vehicle_marketplace",
  "industrial_marketplace",
  "hospitality_listings",
  "business_listings",
  "auction_services",
  "passport_ui",
  "wallet",
  "escrow",
  "developer_api",
  "command_center_consumer",
  "workforce_consumer",
  "mortgage_insurance_ui",
  "national_registry_ui",
  "trust_economy_ui",
];

export type LaunchFeatureSnapshot = {
  feature: LaunchFeature;
  visible: boolean;
  envKey?: string;
};

/** Operator-facing feature flag snapshot for Lex / tech health. */
export function getLaunchFeatureSnapshot(): LaunchFeatureSnapshot[] {
  return LAUNCH_DEFERRED_FEATURES.map((feature) => ({
    feature,
    visible: isLaunchFeatureVisible(feature),
    envKey: FEATURE_ENV[feature],
  }));
}