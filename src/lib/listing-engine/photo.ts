/**
 * Photo engine — metadata-driven checklist + schema resolution.
 * No vision AI; shared media pipeline owns compression / protection.
 */
import type { ListingValues, PhotoChecklistStatus, PhotoRules } from "./types";
import { resolvePhotoSchema } from "./photo-schema/resolve";

export function photoChecklistStatus(
  rules: PhotoRules,
  photoCount: number,
  values: ListingValues = {}
): PhotoChecklistStatus {
  const schema = resolvePhotoSchema(rules, values);
  // Recommended shots always follow the *resolved* schema (category-aware).
  // Optional rules.tips is a hard override only when schema has no recommendedShots.
  const tips =
    schema.recommendedShots.length > 0
      ? [...schema.recommendedShots]
      : [...(rules.tips ?? [])];
  const remainingToMin = Math.max(0, rules.min - photoCount);
  const overMax = photoCount > rules.max;
  return {
    ok: photoCount >= rules.min && !overMax,
    count: photoCount,
    min: rules.min,
    max: rules.max,
    remainingToMin,
    overMax,
    tips,
    warnings: rules.warnings ?? [],
  };
}
