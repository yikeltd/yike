import type { CategoryManifest, ListingValues, PhotoRules } from "../types";
import { evaluateVisibility } from "../visibility";
import { NAMED_VISIBILITY_RULES } from "../rules/registry";
import type { PhotoSchema } from "./types";
import { PROPERTY_PHOTO_RULES, VEHICLE_PHOTO_RULES } from "./rules";

/**
 * Resolve the active photo schema from category metadata + listing values.
 * Variants win in declaration order when their visibility rule matches.
 */
export function resolvePhotoSchema(
  photo: PhotoRules,
  values: ListingValues = {}
): PhotoSchema {
  for (const variant of photo.schemaVariants ?? []) {
    if (evaluateVisibility(variant.when, values, NAMED_VISIBILITY_RULES)) {
      return variant.schema;
    }
  }
  return photo.schema;
}

export function resolvePhotoSchemaFromManifest(
  manifest: CategoryManifest,
  values: ListingValues = {}
): PhotoSchema {
  return resolvePhotoSchema(manifest.photo, values);
}

/** Convenience for legacy property forms that still pass listing/property type. */
export function resolvePropertyPhotoSchema(input: {
  propertyType?: string;
  listingType?: string;
}): PhotoSchema {
  return resolvePhotoSchema(PROPERTY_PHOTO_RULES, {
    property_type: input.propertyType ?? "flat",
    listing_type: input.listingType ?? "rent",
  });
}

export function resolveVehiclePhotoSchema(): PhotoSchema {
  return resolvePhotoSchema(VEHICLE_PHOTO_RULES, {});
}
