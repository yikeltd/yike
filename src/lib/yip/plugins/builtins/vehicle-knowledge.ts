/**
 * Builtin plugin wrapping the existing `VehicleKnowledge` provider. Ports
 * the descriptor previously registered directly in `register-defaults.ts`.
 */
import type { KnowledgeFacade } from "../../knowledge";
import { CAPABILITIES } from "../../registry/capabilities";
import { definePlugin } from "../define-plugin";
import type { YipPlugin } from "../types";

export function createVehicleKnowledgePlugin(knowledge: KnowledgeFacade): YipPlugin {
  return definePlugin({
    id: "yip.vehicle-knowledge",
    name: "Vehicle Knowledge",
    version: "1.0.0",
    description: "Vehicle makes/models/categories/spec options — wraps existing marketplace vehicle data.",
    capabilityType: "knowledge",
    provides: [CAPABILITIES.VEHICLE_KNOWLEDGE],
    permissions: ["knowledge.read"],
    enabledByDefault: true,
    hooks: {},
    registerCapabilities: (ctx) => {
      ctx.registry.register({
        id: CAPABILITIES.VEHICLE_KNOWLEDGE,
        version: "1.0.0",
        enabled: true,
        description: "Vehicle makes/models/categories/spec options — wraps existing marketplace vehicle data.",
        factory: () => knowledge.vehicle,
      });
    },
  });
}
