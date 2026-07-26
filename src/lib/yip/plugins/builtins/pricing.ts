/**
 * Builtin plugin wrapping the pricing service stub. Disabled by default —
 * real comps require a V2 data pipeline.
 */
import { createPricingService } from "../../pricing";
import { CAPABILITIES } from "../../registry/capabilities";
import { definePlugin } from "../define-plugin";
import type { YipPlugin } from "../types";

export function createPricingPlugin(): YipPlugin {
  return definePlugin({
    id: "yip.pricing",
    name: "Pricing Engine",
    version: "0.1.0-stub",
    description: "Market price analysis. Disabled — requires V2 comps data pipeline.",
    capabilityType: "pricing",
    provides: [CAPABILITIES.PRICING_ENGINE],
    enabledByDefault: false,
    hooks: {},
    registerCapabilities: (ctx) => {
      ctx.registry.register({
        id: CAPABILITIES.PRICING_ENGINE,
        version: "0.1.0-stub",
        enabled: false,
        description: "Market price analysis. Disabled — requires V2 comps data pipeline.",
        factory: () => createPricingService(),
      });
    },
  });
}
