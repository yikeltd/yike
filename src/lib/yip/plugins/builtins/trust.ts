/**
 * Builtin plugin wrapping the trust assessment stub. Disabled by default —
 * CORE ships a neutral stub only.
 */
import { createTrustService } from "../../trust";
import { CAPABILITIES } from "../../registry/capabilities";
import { definePlugin } from "../define-plugin";
import type { YipPlugin } from "../types";

export function createTrustPlugin(): YipPlugin {
  return definePlugin({
    id: "yip.trust",
    name: "Trust Assessment",
    version: "0.1.0-stub",
    description: "Seller/listing trust scoring. Disabled — CORE ships a neutral stub only.",
    capabilityType: "trust",
    provides: [CAPABILITIES.TRUST_ASSESSMENT],
    enabledByDefault: false,
    hooks: {},
    registerCapabilities: (ctx) => {
      ctx.registry.register({
        id: CAPABILITIES.TRUST_ASSESSMENT,
        version: "0.1.0-stub",
        enabled: false,
        description: "Seller/listing trust scoring. Disabled — CORE ships a neutral stub only.",
        factory: () => createTrustService(),
      });
    },
  });
}
