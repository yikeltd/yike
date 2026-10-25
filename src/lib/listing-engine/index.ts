/**
 * Metadata-driven listing engine — public exports.
 * See docs/architecture/METADATA_LISTING_ENGINE.md for the architecture and
 * docs/implementation/ENGINE_1_IMPLEMENTATION.md for the M1 implementation
 * notes (this stage: engine foundation, no UI wiring yet).
 */
export type {
  ListingCategoryId,
  FieldOption,
  FieldInputType,
  VisibilityRule,
  DependencyRule,
  ValidationRule,
  SuggestionSource,
  SearchMapping,
  AdminMapping,
  ListingFieldDef,
  ListingStepDef,
  PhotoRules,
  AutofillConfig,
  ReviewRules,
  CategoryManifest,
  ListingValues,
  ResolvedField,
  PhotoChecklistStatus,
  ValidationResult,
  VisibilityRuleEvaluator,
  ValidationRuleEvaluator,
  VisibilityRuleEvaluators,
  ValidationRuleEvaluators,
} from "./types";

export { evaluateVisibility, filterVisibleFields, isFieldVisible } from "./visibility";
export { applyDependencyClears, getOptionsForField } from "./dependency";
export { validateValues } from "./validation";
export { getSuggestions } from "./suggestion";
export type { InferProvider, InferProviders } from "./suggestion";
export { buildTitleFromRecipe, applyAutofill } from "./autofill";
export type { AutofillPatch } from "./autofill";
export { photoChecklistStatus } from "./photo";
export {
  resolvePhotoSchema,
  resolvePhotoSchemaFromManifest,
  resolvePropertyPhotoSchema,
  resolveVehiclePhotoSchema,
  VEHICLE_PHOTO_SCHEMA,
  PROPERTY_RESIDENTIAL_PHOTO_SCHEMA,
  PROPERTY_LAND_PHOTO_SCHEMA,
  PROPERTY_COMMERCIAL_PHOTO_SCHEMA,
  PROPERTY_SHORTLET_PHOTO_SCHEMA,
  DEALER_SHOWROOM_PHOTO_SCHEMA,
  migratePhotoLabel,
  sanitizeMediaItemLabels,
  schemaLabels,
  isValidPhotoLabel,
} from "./photo-schema";
export type { PhotoSchema, PhotoTag, PhotoSchemaVariant } from "./photo-schema";
export { MetadataResolver } from "./resolver";
export {
  computeListingWizardProgress,
  getWizardStageConfigs,
  type WizardProgress,
  type WizardStageId,
} from "./wizard-progress";
export type { ResolverContext, ResolvedListingState } from "./resolver";
export { validateCategoryManifest } from "./validate-config";

export { CATALOG_REGISTRY, getCatalog } from "./catalogs/registry";
export type { CatalogMap, CatalogProvider } from "./catalogs/types";
export { VEHICLE_CATALOGS } from "./catalogs/vehicle";
export { PROPERTY_CATALOGS } from "./catalogs/property";
export { getListingCatalogsFromYip } from "./catalogs/yip-bridge";

export {
  NAMED_VISIBILITY_RULES,
  NAMED_VALIDATION_RULES,
  registerVisibilityRule,
  registerValidationRule,
} from "./rules/registry";

export { VEHICLE_CATEGORY_MANIFEST } from "./categories/vehicle";
export { PROPERTY_CATEGORY_MANIFEST } from "./categories/property";

export { valuesToVehiclePayload } from "./adapters/vehicle";
export { valuesToElectronicsPayload } from "./adapters/electronics";
export type { VehiclePayload } from "./adapters/vehicle";
export { valuesToPropertyPayload } from "./adapters/property";
export {
  buildPropertyCreateApiBody,
  normalizePropertyCreateRequest,
  type PropertyCreateApiBody,
} from "../listing-create/property-api-body";
export type { PropertyPayload } from "./adapters/property";

export {
  CATEGORY_REGISTRY,
  getCategoryManifest,
  tryGetCategoryManifest,
  listCategoryIds,
} from "./registry";
export {
  MANIFEST_CATEGORY_IDS,
  UNSUPPORTED_LISTING_CATEGORY_IDS,
  hasCategoryManifest,
  getCategoryManifestOrNull,
  isListingCategoryCreatable,
  isListingCategoryLaunchVisible,
  getManifestDetailsStepIds,
  getManifestDetailsTitle,
} from "./category-availability";
export {
  clearEngineListingDraft,
  discardEngineListingDraft,
  loadEngineListingDraft,
  loadEngineListingDraftWithLegacyFallback,
  markEngineListingDraftConsumed,
  migrateLegacyVehicleDraft,
  parseEngineListingDraftFromStorageEvent,
  saveEngineListingDraft,
  type DraftSaveResult,
  type EngineListingDraft,
} from "./listing-engine-draft";
export {
  clearListingDraftSessionId,
  getOrCreateListingDraftSessionId,
  resetListingDraftSessionId,
} from "./listing-engine-draft-session";
export {
  buildListingReviewSummary,
  fieldJumpTarget,
  type ReviewSummaryRow,
} from "./review-summary";
export {
  listListingWizardBlockers,
  resolveListingWizardNextAction,
  type WizardBlocker,
  type WizardNextAction,
} from "./wizard-next-action";
