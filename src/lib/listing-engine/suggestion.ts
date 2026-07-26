/**
 * Suggestion engine — configurable assistance only. Never invents factory
 * data; static/catalog sources are metadata-driven. `infer` sources are
 * reserved for future providers (VIN decode, comps) and resolve to no
 * suggestions until a provider is registered — no vision AI, no guessing.
 */
import type { FieldOption, ListingFieldDef, ListingValues } from "./types";
import type { CatalogMap } from "./catalogs/types";

export type InferProvider = (values: ListingValues) => FieldOption[];
export type InferProviders = Record<string, InferProvider>;

export function getSuggestions(
  field: ListingFieldDef,
  values: ListingValues,
  catalogs: CatalogMap,
  inferProviders: InferProviders = {}
): FieldOption[] {
  const source = field.suggestion;
  if (!source || source.type === "none") return [];
  if (source.type === "static") return source.options;
  if (source.type === "catalog") {
    const provider = catalogs[source.id];
    return provider ? provider(values) : [];
  }
  if (source.type === "infer") {
    const provider = inferProviders[source.id];
    return provider ? provider(values) : [];
  }
  return [];
}
