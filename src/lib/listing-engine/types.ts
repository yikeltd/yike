/**
 * Metadata-driven listing engine — core types.
 *
 * Aligns with docs/architecture/METADATA_LISTING_ENGINE.md. These types are the
 * single source of truth for every listing category's field graph. Engines in
 * this module are category-agnostic: they resolve behaviour from this metadata
 * only, never from `if (vehicle)` / `if (property)` conditionals.
 */

export type ListingCategoryId =
  | "vehicle"
  | "property"
  | "electronics"
  | "job"
  | "service"
  | "boat"
  | "agriculture"
  | "fashion"
  | "furniture"
  | "event"
  | "pet"
  | "business"
  | (string & {});

export type FieldOption = {
  value: string;
  label: string;
};

export type FieldInputType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "select"
  | "multiselect"
  | "boolean"
  | "year"
  | "location"
  | "photos"
  | "confirm_chips";

export type VisibilityRule =
  | { op: "always" }
  | { op: "equals"; field: string; value: string | number | boolean | Array<string | number> }
  | { op: "notEquals"; field: string; value: string | number | boolean }
  | { op: "truthy"; field: string }
  | { op: "falsy"; field: string }
  | { op: "and"; rules: VisibilityRule[] }
  | { op: "or"; rules: VisibilityRule[] }
  | { op: "not"; rule: VisibilityRule }
  | { op: "rule"; id: string };

export type DependencyRule = {
  /** Field ids this field's options / value depend on. */
  watch: string[];
  /** Catalog id (see catalogs/registry.ts) that resolves options from current values. */
  optionsFrom: string;
  /** Clear this field's value when it is no longer a valid option (default true). */
  clearIfInvalid?: boolean;
};

export type ValidationRule =
  | { type: "required" }
  | { type: "min" | "max"; value: number }
  | { type: "minLength" | "maxLength"; value: number }
  | { type: "pattern"; value: string; message?: string }
  | { type: "integer" }
  | { type: "when"; visible?: VisibilityRule; rules: ValidationRule[] }
  | { type: "rule"; id: string };

export type SuggestionSource =
  | { type: "static"; options: FieldOption[] }
  | { type: "catalog"; id: string }
  | { type: "infer"; id: string }
  | { type: "none" };

export type SearchMapping = {
  filterKey?: string;
  facet?: boolean;
  card?: "title" | "subtitle" | "meta" | "hidden";
  detail?: "primary" | "specs" | "hidden";
  api?: string;
  export?: string;
};

export type AdminMapping = {
  column?: string;
  filterable?: boolean;
  editable?: boolean;
};

export type ListingFieldDef = {
  id: string;
  label: string;
  input: FieldInputType;
  required?: boolean;
  placeholder?: string;
  description?: string;
  defaultValue?: unknown;
  advanced?: boolean;
  /** Static option list — for selects with a fixed, non-catalog option set. */
  options?: FieldOption[];
  visible?: VisibilityRule;
  dependsOn?: DependencyRule;
  validation?: ValidationRule[];
  suggestion?: SuggestionSource;
  autofill?: { from?: string; confirmOnly?: boolean };
  /** Payload key this field maps to on submit; defaults to `id`. */
  submitKey?: string;
  search?: SearchMapping;
  admin?: AdminMapping;
  analytics?: string;
};

export type ListingStepDef = {
  id: string;
  title: string;
  description?: string;
  sections?: { id: string; title?: string; fieldIds: string[] }[];
  fieldIds?: string[];
};

export type PhotoRules = {
  min: number;
  max: number;
  requiredAngles?: string[];
  tips: string[];
  recommendedCover?: "first" | "sharpest";
  accept?: ("image/jpeg" | "image/png" | "image/webp")[];
  /** Tighten only; never loosen platform MEDIA_LIMITS. */
  maxUploadBytes?: number;
  warnings?: string[];
};

export type AutofillConfig = {
  titleRecipe: string[];
  subtitleRecipe?: string[];
  descriptionRecipe?: "template_v1" | "llm_v2" | "off";
  seoTitleRecipe?: string[];
  seoDescriptionRecipe?: string[];
  tagsFrom?: string[];
  priceSuggestion?: "off" | "anomaly" | "comps_band_v2";
  photoChecklistFromTips?: boolean;
};

export type ReviewRules = {
  checklist: Array<"photos" | "price" | "location" | "details" | string>;
  showLivePreview: boolean;
  successMessageAfterSubmitOnly: true;
};

export type CategoryManifest = {
  id: ListingCategoryId;
  version: number;
  label: string;
  assetType: string;
  steps: ListingStepDef[];
  fields: ListingFieldDef[];
  photo: PhotoRules;
  autofill: AutofillConfig;
  review: ReviewRules;
  submitAdapter: "property" | "vehicle" | string;
  capabilities?: string[];
};

/** Seller-entered / resolved field values keyed by field id. */
export type ListingValues = Record<string, unknown>;

/** A field def resolved against current values — value + computed options/suggestions. */
export type ResolvedField = ListingFieldDef & {
  value: unknown;
  options: FieldOption[];
  suggestions: FieldOption[];
  visible: boolean;
  error?: string;
};

export type PhotoChecklistStatus = {
  ok: boolean;
  count: number;
  min: number;
  max: number;
  remainingToMin: number;
  overMax: boolean;
  tips: string[];
  warnings: string[];
};

export type ValidationResult = {
  ok: boolean;
  errors: Record<string, string>;
};

/** Named rule evaluator lookups — referenced by metadata `{ op: "rule", id }` / `{ type: "rule", id }`. */
export type VisibilityRuleEvaluator = (values: ListingValues) => boolean;
export type ValidationRuleEvaluator = (
  values: ListingValues,
  field: ListingFieldDef
) => string | null;

export type VisibilityRuleEvaluators = Record<string, VisibilityRuleEvaluator>;
export type ValidationRuleEvaluators = Record<string, ValidationRuleEvaluator>;
