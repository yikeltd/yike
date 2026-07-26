/**
 * Builtin plugin wrapping the media intelligence stub. Disabled by default
 * — no vision model in CORE, count checks only.
 */
import { createMediaIntelligenceService } from "../../media";
import { CAPABILITIES } from "../../registry/capabilities";
import { definePlugin } from "../define-plugin";
import type { YipPlugin } from "../types";

export function createMediaAnalysisPlugin(): YipPlugin {
  return definePlugin({
    id: "yip.media-analysis",
    name: "Media Analysis",
    version: "0.1.0-stub",
    description: "Photo quality analysis beyond count checks. Disabled — no vision model in CORE.",
    capabilityType: "media",
    provides: [CAPABILITIES.MEDIA_ANALYSIS],
    enabledByDefault: false,
    hooks: {},
    registerCapabilities: (ctx) => {
      ctx.registry.register({
        id: CAPABILITIES.MEDIA_ANALYSIS,
        version: "0.1.0-stub",
        enabled: false,
        description: "Photo quality analysis beyond count checks. Disabled — no vision model in CORE.",
        factory: () => createMediaIntelligenceService(),
      });
    },
  });
}
