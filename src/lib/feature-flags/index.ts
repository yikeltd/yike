/**
 * Feature Flags Registry — Phase 1.0 & Ecosystem Flags
 *
 * Provides central governance over experimental, beta, and deferred features.
 * Integrates with environment overrides (`ENABLE_*`) and production posture.
 */

import { isProductionEnv } from "@/lib/env";

export type Phase1Feature =
  | "conversation_platform_v1"
  | "voice_call_beta"
  | "video_call_beta"
  | "whatsapp_connect"
  | "buyer_live_walkthrough"
  | "inspection_requests"
  | "buyer_assistance";

const FEATURE_ENV_MAP: Record<Phase1Feature, string> = {
  conversation_platform_v1: "ENABLE_CONVERSATION_PLATFORM_V1",
  voice_call_beta: "ENABLE_VOICE_CALL_BETA",
  video_call_beta: "ENABLE_VIDEO_CALL_BETA",
  whatsapp_connect: "ENABLE_WHATSAPP_CONNECT",
  buyer_live_walkthrough: "ENABLE_BUYER_LIVE_WALKTHROUGH",
  inspection_requests: "ENABLE_INSPECTION_REQUESTS",
  buyer_assistance: "ENABLE_BUYER_ASSISTANCE",
};

// Default active states for Phase 1 flags (active in development/staging, controllable in production)
const DEFAULT_FEATURE_STATES: Record<Phase1Feature, boolean> = {
  conversation_platform_v1: true,
  whatsapp_connect: true,
  inspection_requests: true,
  buyer_assistance: true,
  buyer_live_walkthrough: true,
  voice_call_beta: true,
  video_call_beta: false, // Beta flag default
};

function envFlag(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return fallback;
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return fallback;
}

/** Check if a Phase 1 feature flag is enabled */
export function isFeatureEnabled(feature: Phase1Feature): boolean {
  const envKey = FEATURE_ENV_MAP[feature];
  const fallback = DEFAULT_FEATURE_STATES[feature];
  return envFlag(envKey, fallback);
}

export type FeatureFlagSnapshot = {
  feature: Phase1Feature;
  enabled: boolean;
  envKey: string;
};

/** Get operator-facing snapshot of all Phase 1 feature flags */
export function getFeatureFlagSnapshot(): FeatureFlagSnapshot[] {
  const features = Object.keys(FEATURE_ENV_MAP) as Phase1Feature[];
  return features.map((feature) => ({
    feature,
    enabled: isFeatureEnabled(feature),
    envKey: FEATURE_ENV_MAP[feature],
  }));
}
