/**
 * @deprecated Superseded by `plugins/builtins` + `PluginHost.installAll()`
 * (see `bootstrap.ts`). Kept for external callers that registered
 * capabilities directly against a registry before YIP 2.0's plugin host
 * existed — behavior is unchanged, it just isn't what `createYip()` calls
 * anymore.
 *
 * Registers CORE's default capability set. Knowledge capabilities are
 * enabled (real data, no ML). Intelligence capabilities beyond knowledge
 * (recommendation, pricing, trust, media) are registered but stubbed —
 * enabled at the registry level so callers can discover them via
 * `registry.list()`, but their factories return no-op implementations
 * until real logic lands.
 */
import { createMediaIntelligenceService } from "../media";
import { createPricingService } from "../pricing";
import { createRecommendationEngine } from "../recommendation";
import { createTrustService } from "../trust";
import type { KnowledgeFacade } from "../knowledge";
import { CAPABILITIES } from "./capabilities";
import type { CapabilityRegistry } from "./capability-registry";

export function registerDefaults(registry: CapabilityRegistry, knowledge: KnowledgeFacade): void {
  registry.register({
    id: CAPABILITIES.VEHICLE_KNOWLEDGE,
    version: "1.0.0",
    enabled: true,
    description: "Vehicle makes/models/categories/spec options — wraps existing marketplace vehicle data.",
    factory: () => knowledge.vehicle,
  });

  registry.register({
    id: CAPABILITIES.PROPERTY_KNOWLEDGE,
    version: "1.0.0",
    enabled: true,
    description: "Property listing types/categories/amenities — wraps existing marketplace constants.",
    factory: () => knowledge.property,
  });

  registry.register({
    id: CAPABILITIES.LOCATION_KNOWLEDGE,
    version: "1.0.0",
    enabled: true,
    description: "Nigeria state/city/area lookups — wraps existing location constants.",
    factory: () => knowledge.location,
  });

  registry.register({
    id: CAPABILITIES.MARKET_KNOWLEDGE,
    version: "1.0.0",
    enabled: true,
    description: "Price suggestion lookup — CORE stub, always reports insufficient_data.",
    factory: () => knowledge.market,
  });

  registry.register({
    id: CAPABILITIES.PHOTO_KNOWLEDGE,
    version: "1.0.0",
    enabled: true,
    description: "Photo min/max + tips by domain/category.",
    factory: () => knowledge.photo,
  });

  registry.register({
    id: CAPABILITIES.RECOMMENDATION_ENGINE,
    version: "0.1.0-stub",
    enabled: false,
    description: "Listing/related-item recommendations. Disabled — CORE ships a no-op engine only.",
    factory: () => createRecommendationEngine(),
  });

  registry.register({
    id: CAPABILITIES.PRICING_ENGINE,
    version: "0.1.0-stub",
    enabled: false,
    description: "Market price analysis. Disabled — requires V2 comps data pipeline.",
    factory: () => createPricingService(),
  });

  registry.register({
    id: CAPABILITIES.TRUST_ASSESSMENT,
    version: "0.1.0-stub",
    enabled: false,
    description: "Seller/listing trust scoring. Disabled — CORE ships a neutral stub only.",
    factory: () => createTrustService(),
  });

  registry.register({
    id: CAPABILITIES.MEDIA_ANALYSIS,
    version: "0.1.0-stub",
    enabled: false,
    description: "Photo quality analysis beyond count checks. Disabled — no vision model in CORE.",
    factory: () => createMediaIntelligenceService(),
  });
}
