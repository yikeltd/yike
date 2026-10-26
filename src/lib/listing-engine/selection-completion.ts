/**
 * Measures how much of a listing form can be completed via catalogue-driven inputs
 * (select, searchable_select, chips) vs free typing (text, textarea, currency).
 */
import type { CategoryManifest, ListingFieldDef, ListingValues } from "./types";
import { MetadataResolver } from "./resolver";
import type { CatalogMap } from "./catalogs/types";
import { NAMED_VISIBILITY_RULES } from "./rules/registry";

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
  /** Share of visible fields that are catalogue-driven (target ≥ 0.8). */
  catalogFieldRatio: number;
  filledCount: number;
  filledViaCatalogCapableCount: number;
  /** Of filled fields, share that could be set without typing (catalog-capable types). */
  filledCatalogCapableRatio: number;
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

  const visibleFieldCount = applicable.length;
  const catalogFieldCount = catalogFields.length;

  return {
    categoryId: manifest.id,
    visibleFieldCount,
    catalogFieldCount,
    typingFieldCount: typingFields.length,
    catalogFieldRatio:
      visibleFieldCount > 0 ? catalogFieldCount / visibleFieldCount : 0,
    filledCount: filled.length,
    filledViaCatalogCapableCount: filledCatalogCapable.length,
    filledCatalogCapableRatio:
      filled.length > 0 ? filledCatalogCapable.length / filled.length : 0,
    typingFieldIds: typingFields.map((f) => f.id),
    catalogFieldIds: catalogFields.map((f) => f.id),
  };
}

/** Representative fixture values per vertical for ratio benchmarking. */
export function representativeListingValues(
  vertical: "property" | "vehicle" | "electronics",
): ListingValues {
  if (vertical === "property") {
    return {
      listing_type: "rent",
      property_type: "flat_3",
      bedrooms: "3",
      bathrooms: "3",
      toilets: "3",
      amenities: ["parking", "security"],
      state: "Lagos",
      city: "Lagos",
      area: "Lekki Phase 1",
      title: "3 Bedroom Flat Lekki",
      price: 4_500_000,
      description: "Serviced flat with parking.",
    };
  }
  if (vertical === "vehicle") {
    return {
      auto_category: "car",
      make: "Toyota",
      model: "Camry",
      year: "2019",
      vehicle_condition: "foreign_used",
      transmission: "automatic",
      fuel_type: "petrol",
      state: "Lagos",
      city: "Lagos",
      area: "Ikeja",
      title: "Toyota Camry 2019",
      price: 14_500_000,
      description: "Clean foreign used.",
    };
  }
  return {
    auto_category: "phones_tablets",
    brand: "Samsung",
    model: "Galaxy A54",
    condition: "foreign_used",
    warranty_status: "no_warranty",
    storage_gb: "128",
    state: "Lagos",
    city: "Lagos",
    area: "Ikeja",
    title: "Samsung Galaxy A54",
    price: 680_000,
    description: "UK used with box.",
  };
}
