/**
 * Builtin plugin wrapping the existing `LocationKnowledge` provider.
 */
import type { KnowledgeFacade } from "../../knowledge";
import { CAPABILITIES } from "../../registry/capabilities";
import { definePlugin } from "../define-plugin";
import type { YipPlugin } from "../types";

export function createLocationKnowledgePlugin(knowledge: KnowledgeFacade): YipPlugin {
  return definePlugin({
    id: "yip.location-knowledge",
    name: "Location Knowledge",
    version: "1.0.0",
    description: "Nigeria state/city/area lookups — wraps existing location constants.",
    capabilityType: "knowledge",
    provides: [CAPABILITIES.LOCATION_KNOWLEDGE],
    permissions: ["knowledge.read"],
    enabledByDefault: true,
    hooks: {},
    registerCapabilities: (ctx) => {
      ctx.registry.register({
        id: CAPABILITIES.LOCATION_KNOWLEDGE,
        version: "1.0.0",
        enabled: true,
        description: "Nigeria state/city/area lookups — wraps existing location constants.",
        factory: () => knowledge.location,
      });
    },
  });
}
