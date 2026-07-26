/**
 * Lightweight category registry — the only place that knows every category
 * exists. Adding a category to this map (plus a manifest + catalogs +
 * adapter) is the entire integration surface; no engine changes required.
 */
import type { CategoryManifest, ListingCategoryId } from "./types";
import { VEHICLE_CATEGORY_MANIFEST } from "./categories/vehicle";
import { PROPERTY_CATEGORY_MANIFEST } from "./categories/property";

export const CATEGORY_REGISTRY: Record<string, CategoryManifest> = {
  vehicle: VEHICLE_CATEGORY_MANIFEST,
  property: PROPERTY_CATEGORY_MANIFEST,
};

export function getCategoryManifest(id: ListingCategoryId): CategoryManifest {
  const manifest = CATEGORY_REGISTRY[id];
  if (!manifest) {
    throw new Error(`listing-engine: unknown category "${id}"`);
  }
  return manifest;
}

export function listCategoryIds(): string[] {
  return Object.keys(CATEGORY_REGISTRY);
}
