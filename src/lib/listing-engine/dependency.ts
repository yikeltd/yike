/**
 * Dependency engine — resolves field options from catalogs and clears
 * downstream values that are no longer valid. Category-agnostic: it only
 * follows `dependsOn` / `optionsFrom` metadata.
 */
import type { CategoryManifest, FieldOption, ListingFieldDef, ListingValues } from "./types";
import type { CatalogMap } from "./catalogs/types";

export function getOptionsForField(
  field: ListingFieldDef,
  values: ListingValues,
  catalogs: CatalogMap
): FieldOption[] {
  if (field.options) return field.options;
  if (field.dependsOn?.optionsFrom) {
    const provider = catalogs[field.dependsOn.optionsFrom];
    return provider ? provider(values) : [];
  }
  if (field.suggestion?.type === "static") return field.suggestion.options;
  if (field.suggestion?.type === "catalog") {
    const provider = catalogs[field.suggestion.id];
    return provider ? provider(values) : [];
  }
  return [];
}

/**
 * When `changedKey` changes, clear any field whose `dependsOn.watch`
 * includes it and whose current value is no longer a valid option.
 * Without `catalogs`, downstream values are cleared unconditionally
 * (matches existing cascading-select UX: changing make always clears model).
 */
export function applyDependencyClears(
  manifest: CategoryManifest,
  changedKey: string,
  values: ListingValues,
  catalogs?: CatalogMap
): ListingValues {
  let next: ListingValues = { ...values };
  const queue: string[] = [changedKey];
  const cleared = new Set<string>();

  while (queue.length > 0) {
    const key = queue.shift() as string;
    for (const field of manifest.fields) {
      const dep = field.dependsOn;
      if (!dep || !dep.watch.includes(key)) continue;
      if (dep.clearIfInvalid === false) continue;
      if (cleared.has(field.id)) continue;

      const current = next[field.id];
      if (current === undefined || current === null || current === "") continue;

      let invalid = true;
      if (catalogs) {
        const options = getOptionsForField(field, next, catalogs);
        invalid = !options.some((o) => String(o.value) === String(current));
      }

      if (invalid) {
        next = { ...next, [field.id]: undefined };
        cleared.add(field.id);
        queue.push(field.id);
      }
    }
  }

  return next;
}
