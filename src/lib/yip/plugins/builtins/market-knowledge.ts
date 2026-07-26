/**
 * Builtin plugin wrapping the existing `MarketKnowledge` provider (price
 * suggestion stub — always reports `insufficient_data`, never fabricates).
 */
import type { KnowledgeFacade } from "../../knowledge";
import { CAPABILITIES } from "../../registry/capabilities";
import { definePlugin } from "../define-plugin";
import type { YipPlugin } from "../types";

export function createMarketKnowledgePlugin(knowledge: KnowledgeFacade): YipPlugin {
  return definePlugin({
    id: "yip.market-knowledge",
    name: "Market Knowledge",
    version: "1.0.0",
    description: "Price suggestion lookup — CORE stub, always reports insufficient_data.",
    capabilityType: "knowledge",
    provides: [CAPABILITIES.MARKET_KNOWLEDGE],
    permissions: ["knowledge.read"],
    enabledByDefault: true,
    hooks: {},
    registerCapabilities: (ctx) => {
      ctx.registry.register({
        id: CAPABILITIES.MARKET_KNOWLEDGE,
        version: "1.0.0",
        enabled: true,
        description: "Price suggestion lookup — CORE stub, always reports insufficient_data.",
        factory: () => knowledge.market,
      });
    },
  });
}
