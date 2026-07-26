/**
 * Yike Intelligence Platform (YIP) — public package surface.
 *
 * See docs/architecture/YIKE_INTELLIGENCE_PLATFORM.md for architecture,
 * module map, and what's deliberately not built yet. This package has no
 * Next.js/React dependencies — it is designed to be extracted into its own
 * package for reuse across the Stankings ecosystem (BamSignal, BayRight).
 */

export { createYip } from "./bootstrap";
export type { YipPlatform } from "./bootstrap";

export * from "./shared/types";
export * from "./shared/errors";

export { CapabilityRegistry } from "./registry/capability-registry";
export type { CapabilityDescriptor, ICapabilityRegistry, RegisteredCapability } from "./registry/types";
export { CAPABILITIES } from "./registry/capabilities";
export type { CapabilityKey } from "./registry/capabilities";
/** @deprecated see `plugins/builtins` + `PluginHost.installAll()` */
export { registerDefaults } from "./registry/register-defaults";

export { PluginHost } from "./plugins/host";
export type { PluginHostDeps } from "./plugins/host";
export { assertValidPlugin, definePlugin } from "./plugins/define-plugin";
export { resolveInstallOrder, validatePluginGraph } from "./plugins/dependency";
export type { PluginGraphValidation } from "./plugins/dependency";
export {
  InvalidPluginError,
  PluginConflictError,
  PluginDependencyError,
  PluginLifecycleError,
  PluginNotFoundError,
} from "./plugins/errors";
export type {
  PluginDiagnostics,
  PluginHealth,
  PluginHealthStatus,
  PluginId,
  PluginLifecycleState,
  PluginPermission,
  PluginProviderOption,
  YipPlugin,
  YipPluginContext,
  YipPluginHooks,
} from "./plugins/types";
export { BUILTIN_PLUGINS, createBuiltinPlugins } from "./plugins/builtins";

export { EventBus } from "./events/event-bus";
export type {
  BaseEvent,
  CategorySelectedEvent,
  EventHandler,
  EventOfType,
  ListingCreatedEvent,
  ListingPublishedEvent,
  ListingUpdatedEvent,
  PhotoRemovedEvent,
  PhotoUploadedEvent,
  PriceChangedEvent,
  Unsubscribe,
  YipEvent,
  YipEventType,
} from "./events/types";

export {
  DefaultCategoryKnowledge,
  KnowledgeFacade,
  createKnowledgeFacade,
  createLocationKnowledge,
  createMarketKnowledge,
  createPhotoKnowledge,
  createPropertyKnowledge,
  createVehicleKnowledge,
} from "./knowledge";
export type {
  CategoryKnowledge,
  LocationKnowledge,
  MarketKnowledge,
  PhotoGuidance,
  PhotoKnowledge,
  PriceSuggestion,
  PriceSuggestionAvailable,
  PriceSuggestionInput,
  PriceSuggestionUnavailable,
  PropertyKnowledge,
  VehicleKnowledge,
} from "./knowledge";

export { buildContext } from "./context/build-context";
export type { BuildContextInput, YipContext } from "./context/types";

export { createDecisionService, NoOpDecisionService } from "./decision";
export type { Decision, DecisionService } from "./decision";

export { createRecommendationEngine, StubRecommendationEngine } from "./recommendation";
export type { Recommendation, RecommendationEngine } from "./recommendation";

export { createValidationService, PassthroughValidationService } from "./validation";
export type { ValidationOutcome, ValidationService } from "./validation";

export { createPricingService, StubPricingService } from "./pricing";
export type { MarketAnalysis, PricingService } from "./pricing";

export { createTrustService, StubTrustService } from "./trust";
export type { TrustAssessment, TrustService } from "./trust";

export { createMediaIntelligenceService, StubMediaIntelligenceService } from "./media";
export type { MediaIntelligenceInput, MediaIntelligenceService, MediaQualityHint } from "./media";

export { createWorkflowOrchestrator, StubWorkflowOrchestrator } from "./workflow";
export type { WorkflowOrchestrator, WorkflowState, WorkflowStep } from "./workflow";

export { createRulesEngine, DefaultRulesEngine } from "./rules";
export type { RuleEvaluator, RulesEngine } from "./rules";

export { EXTERNAL_PROVIDER_MARKERS, listExternalProviderMarkers } from "./integration";
export type { ExternalProviderKind, ExternalProviderMarker } from "./integration";

export { createAnalyticsSink, NoOpAnalyticsSink } from "./analytics";
export type { AnalyticsSink } from "./analytics";

export { createLearningLayer, UnimplementedLearningLayer } from "./learning";
export type { LearningLayer, LearningSignal } from "./learning";
