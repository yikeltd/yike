/**
 * Autofill engine — deterministic recipes only (no LLM in this stage).
 * Stops overwriting once the seller has touched the field, matching the
 * existing vehicle title behaviour.
 */
import type { AutofillConfig, CategoryManifest, ListingValues } from "./types";

export function buildTitleFromRecipe(recipe: string[], values: ListingValues): string {
  const parts = recipe
    .map((key) => values[key])
    .filter((v) => v !== undefined && v !== null && String(v).trim() !== "")
    .map((v) => String(v).trim());
  return parts.join(" ");
}

export type AutofillPatch = Partial<ListingValues>;

export function applyAutofill(
  manifest: CategoryManifest,
  values: ListingValues,
  opts: { titleTouched?: boolean; subtitleTouched?: boolean } = {}
): AutofillPatch {
  const patch: AutofillPatch = {};
  const config: AutofillConfig = manifest.autofill;

  if (!opts.titleTouched && config.titleRecipe?.length) {
    const title = buildTitleFromRecipe(config.titleRecipe, values);
    if (title && title !== values.title) patch.title = title;
  }

  if (!opts.subtitleTouched && config.subtitleRecipe?.length) {
    const subtitle = buildTitleFromRecipe(config.subtitleRecipe, values);
    if (subtitle && subtitle !== values.subtitle) patch.subtitle = subtitle;
  }

  return patch;
}
