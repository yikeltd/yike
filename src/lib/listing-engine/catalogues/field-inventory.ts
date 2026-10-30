/**
 * Explicit inventory of wizard fields vs catalogue connectivity (manifest + resolver).
 */
import { MetadataResolver } from "../resolver";
import { getOptionsForField } from "../dependency";
import type { CatalogMap } from "../catalogs/types";
import type { CategoryManifest, ListingFieldDef, ListingValues } from "../types";
import { NAMED_VISIBILITY_RULES } from "../rules/registry";

export type FieldCatalogueMode =
  | "static_options"
  | "catalog_provider"
  | "chips"
  | "free_text"
  | "photos";

export type FieldInventoryEntry = {
  fieldId: string;
  label: string;
  required: boolean;
  input: string;
  advanced: boolean;
  mode: FieldCatalogueMode;
  optionsFrom?: string;
  parentDependencies: string[];
  /** Provider id exists in catalog map (or inline options). */
  connected: boolean;
  /** Options resolve to a non-empty list for the sample values context. */
  usableOptionsAtSample: boolean;
  optionCountAtSample: number;
  notes?: string;
};

const CHIP_INPUTS = new Set(["confirm_chips", "boolean"]);
const FREE_TEXT = new Set(["text", "textarea", "number", "currency", "year", "photos"]);

function modeForField(field: ListingFieldDef): FieldCatalogueMode {
  if (field.input === "photos") return "photos";
  if (FREE_TEXT.has(field.input)) return "free_text";
  if (CHIP_INPUTS.has(field.input)) return "chips";
  if (field.options?.length) return "static_options";
  if (field.dependsOn?.optionsFrom || field.suggestion?.type === "catalog") {
    return "catalog_provider";
  }
  return "free_text";
}

function providerId(field: ListingFieldDef): string | undefined {
  if (field.dependsOn?.optionsFrom) return field.dependsOn.optionsFrom;
  if (field.suggestion?.type === "catalog") return field.suggestion.id;
  return undefined;
}

function isConnected(field: ListingFieldDef, catalogs: CatalogMap): boolean {
  if (field.options?.length) return true;
  const id = providerId(field);
  if (id) return Boolean(catalogs[id]);
  if (CHIP_INPUTS.has(field.input) && field.dependsOn?.optionsFrom) {
    return Boolean(catalogs[field.dependsOn.optionsFrom]);
  }
  return false;
}

export function buildFieldInventory(
  manifest: CategoryManifest,
  values: ListingValues,
  catalogs: CatalogMap,
  opts?: { photoCount?: number },
): FieldInventoryEntry[] {
  const resolved = MetadataResolver.compute(manifest, values, catalogs, {
    visibilityEvaluators: NAMED_VISIBILITY_RULES,
    photoCount: opts?.photoCount ?? 0,
  });

  return resolved.visibleFields.map((field) => {
    const mode = modeForField(field);
    const connected =
      mode === "free_text" || mode === "photos"
        ? false
        : mode === "static_options" || isConnected(field, catalogs);
    const options =
      mode === "free_text" || mode === "photos"
        ? []
        : getOptionsForField(field, values, catalogs);
    const parentDependencies = field.dependsOn?.watch.filter(Boolean) ?? [];

    let notes: string | undefined;
    if (mode === "catalog_provider" && connected && options.length === 0) {
      notes =
        parentDependencies.length > 0
          ? "Catalogue connected; select parent field(s) or use manual entry where allowed."
          : "Catalogue connected but empty — add source data or use manual entry.";
    }

    return {
      fieldId: field.id,
      label: field.label,
      required: Boolean(field.required),
      input: field.input,
      advanced: Boolean(field.advanced),
      mode,
      optionsFrom: providerId(field),
      parentDependencies,
      connected,
      usableOptionsAtSample: options.length > 0,
      optionCountAtSample: options.length,
      notes,
    };
  });
}

export function inventoryConnectivityGaps(entries: FieldInventoryEntry[]): FieldInventoryEntry[] {
  return entries.filter(
    (e) =>
      e.mode === "catalog_provider" &&
      !e.connected &&
      !e.advanced &&
      e.input !== "photos",
  );
}
