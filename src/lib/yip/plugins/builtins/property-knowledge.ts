/**
 * Builtin plugin wrapping the existing `PropertyKnowledge` provider.
 */
import type { KnowledgeFacade } from "../../knowledge";
import { CAPABILITIES } from "../../registry/capabilities";
import { definePlugin } from "../define-plugin";
import type { YipPlugin } from "../types";

export function createPropertyKnowledgePlugin(knowledge: KnowledgeFacade): YipPlugin {
  return definePlugin({
    id: "yip.property-knowledge",
    name: "Property Knowledge",
    version: "1.0.0",
    description: "Property listing types/categories/amenities — wraps existing marketplace constants.",
    capabilityType: "knowledge",
    provides: [CAPABILITIES.PROPERTY_KNOWLEDGE],
    permissions: ["knowledge.read"],
    enabledByDefault: true,
    hooks: {},
    registerCapabilities: (ctx) => {
      ctx.registry.register({
        id: CAPABILITIES.PROPERTY_KNOWLEDGE,
        version: "1.0.0",
        enabled: true,
        description: "Property listing types/categories/amenities — wraps existing marketplace constants.",
        factory: () => knowledge.property,
      });
    },
  });
}
