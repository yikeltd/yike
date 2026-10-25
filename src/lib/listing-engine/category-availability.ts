import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import type { CategoryManifest, ListingCategoryId } from "./types";
import { CATEGORY_REGISTRY } from "./registry";

/** Categories with a shipped manifest in CATEGORY_REGISTRY. */
export const MANIFEST_CATEGORY_IDS = Object.keys(
  CATEGORY_REGISTRY,
) as ListingCategoryId[];

/**
 * Deferred verticals referenced in types but not supported for create/edit via
 * ListingEngine. Existing DB rows and admin routes are unchanged.
 */
export const UNSUPPORTED_LISTING_CATEGORY_IDS = [
  "job",
  "service",
  "boat",
  "agriculture",
  "fashion",
  "furniture",
  "event",
  "pet",
  "business",
] as const;

export type UnsupportedListingCategoryId =
  (typeof UNSUPPORTED_LISTING_CATEGORY_IDS)[number];

export function hasCategoryManifest(
  categoryId: string,
): categoryId is ListingCategoryId {
  return Object.prototype.hasOwnProperty.call(CATEGORY_REGISTRY, categoryId);
}

export function getCategoryManifestOrNull(
  categoryId: string,
): CategoryManifest | null {
  if (!hasCategoryManifest(categoryId)) return null;
  return CATEGORY_REGISTRY[categoryId]!;
}

export function isListingCategoryLaunchVisible(
  categoryId: ListingCategoryId,
): boolean {
  if (categoryId === "vehicle") {
    return isLaunchFeatureVisible("vehicle_marketplace");
  }
  if (categoryId === "electronics") {
    return isLaunchFeatureVisible("electronics_marketplace");
  }
  return true;
}

/** Seller can create a new listing in this category (manifest + launch flags). */
export function isListingCategoryCreatable(categoryId: string): boolean {
  if (!hasCategoryManifest(categoryId)) return false;
  return isListingCategoryLaunchVisible(categoryId as ListingCategoryId);
}

export function assertListingCategoryCreatable(categoryId: string): void {
  if (!hasCategoryManifest(categoryId)) {
    throw new Error(
      `listing-engine: category "${categoryId}" has no manifest — creation is unavailable.`,
    );
  }
  if (!isListingCategoryLaunchVisible(categoryId as ListingCategoryId)) {
    throw new Error(
      `listing-engine: category "${categoryId}" is hidden by launch mode.`,
    );
  }
}

const WIZARD_META_STEP_IDS = new Set([
  "pricing",
  "location",
  "photos",
  "review",
]);

/** Detail steps for wizard stage 1 — derived from manifest, not property defaults. */
export function getManifestDetailsStepIds(manifest: CategoryManifest): string[] {
  return manifest.steps
    .map((s) => s.id)
    .filter((id) => !WIZARD_META_STEP_IDS.has(id));
}

export function getManifestDetailsTitle(manifest: CategoryManifest): string {
  const first = manifest.steps.find((s) =>
    getManifestDetailsStepIds(manifest).includes(s.id),
  );
  if (first?.title && getManifestDetailsStepIds(manifest).length === 1) {
    return first.title;
  }
  return `${manifest.label} details`;
}
