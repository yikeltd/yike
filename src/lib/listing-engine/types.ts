/**
 * UNIVERSAL LISTING FLOW ENGINE — CORE TYPES & SCHEMAS
 * Configuration-driven architecture for all Yike marketplace categories.
 */

import type { PhotoSchema, PhotoSchemaVariant } from "./photo-schema/types";

export type FlowState =
  | "category_selected"
  | "details_started"
  | "details_complete"
  | "media_uploaded"
  | "review_ready"
  | "publishing"
  | "published";

export type QuestionType =
  | "text"
  | "number"
  | "currency"
  | "dropdown"
  | "searchable_select"
  | "radio"
  | "checkbox"
  | "toggle"
  | "date"
  | "multi_select"
  | "photo_upload"
  | "document_upload"
  | "location_picker"
  | "card_select";

export type QuestionOption = {
  id: string;
  label: string;
  subtitle?: string;
  assetCategory?: "cars" | "props";
  assetName?: string;
  badge?: string;
};

export type DependencyCondition = {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "in" | "truthy" | "falsy";
  value?: unknown;
};

export type ValidationRule =
  | { type: "required"; message?: string }
  | { type: "min"; value: number; message?: string }
  | { type: "max"; value: number; message?: string }
  | { type: "minLength"; value: number; message?: string }
  | { type: "maxLength"; value: number; message?: string }
  | { type: "pattern"; value: string | RegExp; message?: string }
  | { type: "minPhotos"; value: number; message?: string }
  | { type: "integer"; message?: string }
  | { type: "when"; visible?: VisibilityRule; rules: ValidationRule[]; message?: string }
  | { type: "rule"; id: string; message?: string };

export type QuestionFieldConfig = {
  id: string;
  label: string;
  type: QuestionType;
  placeholder?: string;
  helpText?: string;
  options?: readonly QuestionOption[] | QuestionOption[];
  validation?: ValidationRule[];
  dependencies?: DependencyCondition[];
  defaultValue?: unknown;
  stepId: string;
};

export type ListingStepConfig = {
  id: string;
  title: string;
  subtitle?: string;
  fields: QuestionFieldConfig[];
};

export type ListingCategoryConfig = {
  id: string;
  label: string;
  description: string;
  assetCategory: "cars" | "props";
  defaultAsset: string;
  steps: ListingStepConfig[];
};

export type DraftState = {
  categoryId: string;
  currentState: FlowState;
  stepIndex: number;
  data: Record<string, unknown>;
  lastSavedAt: string;
};

/* ========================================================================= */
/* LEGACY ENGINE BACKWARD COMPATIBILITY TYPES */
/* ========================================================================= */

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
  watch: string[];
  optionsFrom: string;
  clearIfInvalid?: boolean;
};

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
  options?: FieldOption[];
  visible?: VisibilityRule;
  dependsOn?: DependencyRule;
  validation?: ValidationRule[];
  suggestion?: SuggestionSource;
  autofill?: { from?: string; confirmOnly?: boolean };
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
  schema: PhotoSchema;
  schemaVariants?: PhotoSchemaVariant[];
  requiredAngles?: string[];
  tips?: string[];
  recommendedCover?: "first" | "sharpest";
  accept?: ("image/jpeg" | "image/png" | "image/webp")[];
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

export type ListingValues = Record<string, unknown>;

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

export type VisibilityRuleEvaluator = (values: ListingValues) => boolean;
export type ValidationRuleEvaluator = (
  values: ListingValues,
  field: ListingFieldDef
) => string | null;

export type VisibilityRuleEvaluators = Record<string, VisibilityRuleEvaluator>;
export type ValidationRuleEvaluators = Record<string, ValidationRuleEvaluator>;
