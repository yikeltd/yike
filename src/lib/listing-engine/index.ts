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
export type { VehiclePayload } from "./adapters/vehicle";
export { valuesToPropertyPayload } from "./adapters/property";
export type { PropertyPayload } from "./adapters/property";

export { CATEGORY_REGISTRY, getCategoryManifest, listCategoryIds } from "./registry";
