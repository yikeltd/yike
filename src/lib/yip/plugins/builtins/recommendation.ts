/**
 * Builtin plugin wrapping the recommendation engine stub. Disabled by
 * default — CORE ships a no-op engine only. Soft-depends on the vehicle and
 * property knowledge plugins (a future real engine would read from them);
 * this dependency only blocks `enable()`, not installation.
 */
import { createRecommendationEngine } from "../../recommendation";
import { CAPABILITIES } from "../../registry/capabilities";
import { definePlugin } from "../define-plugin";
import type { YipPlugin } from "../types";

export function createRecommendationPlugin(): YipPlugin {
  return definePlugin({
    id: "yip.recommendation",
    name: "Recommendation Engine",
    version: "0.1.0-stub",
    description: "Listing/related-item recommendations. Disabled — CORE ships a no-op engine only.",
    capabilityType: "recommendation",
    provides: [CAPABILITIES.RECOMMENDATION_ENGINE],
    dependsOn: [CAPABILITIES.VEHICLE_KNOWLEDGE, CAPABILITIES.PROPERTY_KNOWLEDGE],
    enabledByDefault: false,
    hooks: {},
    registerCapabilities: (ctx) => {
      ctx.registry.register({
        id: CAPABILITIES.RECOMMENDATION_ENGINE,
        version: "0.1.0-stub",
        enabled: false,
        description: "Listing/related-item recommendations. Disabled — CORE ships a no-op engine only.",
        factory: () => createRecommendationEngine(),
      });
    },
  });
}
