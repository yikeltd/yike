/**
 * Builtin plugin — Trust Assessment (bridges src/lib/trust + listing-quality).
 */
import { createTrustPlatform } from "../../capabilities/trust";
import { CAPABILITIES } from "../../registry/capabilities";
import { definePlugin } from "../define-plugin";
import type { YipPlugin } from "../types";

export function createTrustPlugin(): YipPlugin {
  return definePlugin({
    id: "yip.trust",
    name: "Trust Assessment",
    version: "1.0.0",
    description:
      "Seller/listing trust scoring via existing trust + listing-quality engines (no new formulas).",
    capabilityType: "trust",
    provides: [CAPABILITIES.TRUST_ASSESSMENT],
    enabledByDefault: true,
    hooks: {
      healthCheck: async () => {
        const health = createTrustPlatform().health();
        return {
          status: health.status,
          message: health.message,
          checkedAt: health.checkedAt,
        };
      },
    },
    registerCapabilities: (ctx) => {
      ctx.registry.register({
        id: CAPABILITIES.TRUST_ASSESSMENT,
        version: "1.0.0",
        enabled: true,
        description: "Trust assessment bridged to production engines",
        factory: () => createTrustPlatform(),
      });
    },
  });
}
