/**
 * Photo engine — metadata-driven checklist status only. No vision AI, no
 * duplicate upload pipeline; the shared media pipeline still owns
 * compression / protection (see src/lib/media/*).
 */
import type { PhotoChecklistStatus, PhotoRules } from "./types";

export function photoChecklistStatus(rules: PhotoRules, photoCount: number): PhotoChecklistStatus {
  const remainingToMin = Math.max(0, rules.min - photoCount);
  const overMax = photoCount > rules.max;
  return {
    ok: photoCount >= rules.min && !overMax,
    count: photoCount,
    min: rules.min,
    max: rules.max,
    remainingToMin,
    overMax,
    tips: rules.tips,
    warnings: rules.warnings ?? [],
  };
}
