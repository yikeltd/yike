/**
 * Builtin plugin wrapping the existing `PhotoKnowledge` provider.
 */
import type { KnowledgeFacade } from "../../knowledge";
import { CAPABILITIES } from "../../registry/capabilities";
import { definePlugin } from "../define-plugin";
import type { YipPlugin } from "../types";

export function createPhotoKnowledgePlugin(knowledge: KnowledgeFacade): YipPlugin {
  return definePlugin({
    id: "yip.photo-knowledge",
    name: "Photo Knowledge",
    version: "1.0.0",
    description: "Photo min/max + tips by domain/category.",
    capabilityType: "knowledge",
    provides: [CAPABILITIES.PHOTO_KNOWLEDGE],
    permissions: ["knowledge.read"],
    enabledByDefault: true,
    hooks: {},
    registerCapabilities: (ctx) => {
      ctx.registry.register({
        id: CAPABILITIES.PHOTO_KNOWLEDGE,
        version: "1.0.0",
        enabled: true,
        description: "Photo min/max + tips by domain/category.",
        factory: () => knowledge.photo,
      });
    },
  });
}
