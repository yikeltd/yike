/**
 * Measures catalogue availability vs actual selection completion (no manual typing).
 */
import type { CategoryManifest, ListingFieldDef, ListingValues } from "./types";
import { MetadataResolver } from "./resolver";
import { getOptionsForField } from "./dependency";
import type { CatalogMap } from "./catalogs/types";
import { NAMED_VISIBILITY_RULES } from "./rules/registry";
export { representativeListingValues } from "./listing-scenarios";

const CATALOG_INPUTS = new Set([
  "select",
  "searchable_select",
  "multiselect",
  "confirm_chips",
  "boolean",
  "location",
]);

const TYPING_INPUTS = new Set(["text", "textarea", "number", "currency", "year"]);

/** Narrative / freeform fields excluded from the 80% catalogue target (still required to publish). */
const NARRATIVE_FIELD_IDS = new Set([
  "title",
  "description",
  "price",
  "video_url",
  "warranty_note",
  "landmark",
  "address_hint",
]);

export type SelectionCompletionReport = {
  categoryId: string;
  visibleFieldCount: number;
  catalogFieldCount: number;
  typingFieldCount: number;
  /** Share of applicable fields whose input type is catalogue-driven (not selection success). */
  catalogFieldRatio: number;
  filledCount: number;
  filledViaCatalogCapableCount: number;
  /** Of filled fields, share that use catalogue-capable input types (legacy metric). */
  filledCatalogCapableRatio: number;
  /** Applicable catalogue fields with a connected provider / static options. */
  catalogConnectedCount: number;
  catalogAvailabilityRatio: number;
  /** Applicable catalogue fields with ≥1 resolved option for current values. */
  catalogUsableCount: number;
  catalogUsableRatio: number;
  /** Filled catalogue fields whose value matches a resolved catalogue option. */
  selectedViaCatalogCount: number;
  selectionCompletionRatio: number;
  requiredApplicableCount: number;
  requiredSelectionCompletionRatio: number;
  optionalApplicableCount: number;
  optionalSelectionCompletionRatio: number;
  manualEntryFieldIds: string[];
  typingFieldIds: string[];
  catalogFieldIds: string[];
};

function isFilled(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function isCatalogConnected(field: ListingFieldDef, catalogs: CatalogMap): boolean {
  if (field.options?.length) return true;
  const from = field.dependsOn?.optionsFrom;
  if (from) return Boolean(catalogs[from]);
  if (field.suggestion?.type === "catalog") return Boolean(catalogs[field.suggestion.id]);
  if (field.suggestion?.type === "static") return field.suggestion.options.length > 0;
  return CATALOG_INPUTS.has(field.input);
}

function valueMatchesCatalogOption(
  field: ListingFieldDef,
  value: unknown,
  options: { value: string; label: string }[],
): boolean {
  if (!isFilled(value)) return false;
  if (field.input === "multiselect") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    if (selected.length === 0) return false;
    const allowed = new Set(options.map((o) => String(o.value)));
    return selected.every((v) => allowed.has(String(v)));
  }
  if (field.input === "boolean") {
    return value === true || value === "on" || value === "true" || value === false || value === "";
  }
  return options.some((o) => String(o.value) === String(value));
}

function ratio(num: number, den: number): number {
  return den > 0 ? num / den : 0;
}

function selectionRatioForFields(
  fields: ListingFieldDef[],
  values: ListingValues,
  catalogs: CatalogMap,
): number {
  const catalogFields = fields.filter((f) => CATALOG_INPUTS.has(f.input));
  const filled = catalogFields.filter((f) => isFilled(values[f.id]));
  const selected = filled.filter((f) => {
    const options = getOptionsForField(f, values, catalogs);
    return valueMatchesCatalogOption(f, values[f.id], options);
  });
  return ratio(selected.length, filled.length);
}

export function computeSelectionCompletion(
  manifest: CategoryManifest,
  values: ListingValues,
  catalogs: CatalogMap,
  opts?: { photoCount?: number },
): SelectionCompletionReport {
  const resolved = MetadataResolver.compute(manifest, values, catalogs, {
    visibilityEvaluators: NAMED_VISIBILITY_RULES,
    photoCount: opts?.photoCount ?? 0,
  });

  const visible: ListingFieldDef[] = resolved.visibleFields.filter(
    (f) => f.input !== "photos" && !f.advanced,
  );

  const applicable = visible.filter((f) => !NARRATIVE_FIELD_IDS.has(f.id));

  const catalogFields = applicable.filter((f) => CATALOG_INPUTS.has(f.input));
  const typingFields = applicable.filter((f) => TYPING_INPUTS.has(f.input));

  const filled = applicable.filter((f) => isFilled(values[f.id]));
  const filledCatalogCapable = filled.filter((f) => CATALOG_INPUTS.has(f.input));

  const connectedCatalog = catalogFields.filter((f) => isCatalogConnected(f, catalogs));
  const usableCatalog = catalogFields.filter((f) => {
    if (!isCatalogConnected(f, catalogs)) return false;
    return getOptionsForField(f, values, catalogs).length > 0;
  });

  const filledCatalog = catalogFields.filter((f) => isFilled(values[f.id]));
  const selectedViaCatalog = filledCatalog.filter((f) => {
    const options = getOptionsForField(f, values, catalogs);
    return valueMatchesCatalogOption(f, values[f.id], options);
  });
  const manualEntryFieldIds = filledCatalog
    .filter((f) => {
      const options = getOptionsForField(f, values, catalogs);
      return !valueMatchesCatalogOption(f, values[f.id], options);
    })
    .map((f) => f.id);

  const requiredApplicable = applicable.filter((f) => f.required);
  const optionalApplicable = applicable.filter((f) => !f.required);

  const visibleFieldCount = applicable.length;
  const catalogFieldCount = catalogFields.length;

  return {
    categoryId: manifest.id,
    visibleFieldCount,
    catalogFieldCount,
    typingFieldCount: typingFields.length,
    catalogFieldRatio: ratio(catalogFieldCount, visibleFieldCount),
    filledCount: filled.length,
    filledViaCatalogCapableCount: filledCatalogCapable.length,
    filledCatalogCapableRatio: ratio(filledCatalogCapable.length, filled.length),
    catalogConnectedCount: connectedCatalog.length,
    catalogAvailabilityRatio: ratio(connectedCatalog.length, catalogFieldCount),
    catalogUsableCount: usableCatalog.length,
    catalogUsableRatio: ratio(usableCatalog.length, catalogFieldCount),
    selectedViaCatalogCount: selectedViaCatalog.length,
    selectionCompletionRatio: ratio(selectedViaCatalog.length, filledCatalog.length),
    requiredApplicableCount: requiredApplicable.length,
    requiredSelectionCompletionRatio: selectionRatioForFields(
      requiredApplicable,
      values,
      catalogs,
    ),
    optionalApplicableCount: optionalApplicable.length,
    optionalSelectionCompletionRatio: selectionRatioForFields(
      optionalApplicable,
      values,
      catalogs,
    ),
    manualEntryFieldIds,
    typingFieldIds: typingFields.map((f) => f.id),
    catalogFieldIds: catalogFields.map((f) => f.id),
  };
}
