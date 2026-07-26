/**
 * Builtin CORE plugins — same capability set previously wired directly in
 * `registry/register-defaults.ts`, now installed through `PluginHost`.
 */
import { createKnowledgeFacade, type KnowledgeFacade } from "../../knowledge";
import type { YipPlugin } from "../types";
import { createLocationKnowledgePlugin } from "./location-knowledge";
import { createMarketKnowledgePlugin } from "./market-knowledge";
import { createMediaAnalysisPlugin } from "./media-analysis";
import { createPhotoKnowledgePlugin } from "./photo-knowledge";
import { createPricingPlugin } from "./pricing";
import { createPropertyKnowledgePlugin } from "./property-knowledge";
import { createRecommendationPlugin } from "./recommendation";
import { createTrustPlugin } from "./trust";
import { createVehicleKnowledgePlugin } from "./vehicle-knowledge";

export function createBuiltinPlugins(knowledge: KnowledgeFacade): YipPlugin[] {
  return [
    createVehicleKnowledgePlugin(knowledge),
    createPropertyKnowledgePlugin(knowledge),
    createLocationKnowledgePlugin(knowledge),
    createMarketKnowledgePlugin(knowledge),
    createPhotoKnowledgePlugin(knowledge),
    createRecommendationPlugin(),
    createPricingPlugin(),
    createTrustPlugin(),
    createMediaAnalysisPlugin(),
  ];
}

/** Convenience export for callers that don't need a custom `KnowledgeFacade`. */
export const BUILTIN_PLUGINS: YipPlugin[] = createBuiltinPlugins(createKnowledgeFacade());

export { createLocationKnowledgePlugin } from "./location-knowledge";
export { createMarketKnowledgePlugin } from "./market-knowledge";
export { createMediaAnalysisPlugin } from "./media-analysis";
export { createPhotoKnowledgePlugin } from "./photo-knowledge";
export { createPricingPlugin } from "./pricing";
export { createPropertyKnowledgePlugin } from "./property-knowledge";
export { createRecommendationPlugin } from "./recommendation";
export { createTrustPlugin } from "./trust";
export { createVehicleKnowledgePlugin } from "./vehicle-knowledge";
