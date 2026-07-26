import type { FieldOption, ListingValues } from "../types";

/** Resolves selectable options for a catalog id from current listing values. */
export type CatalogProvider = (values: ListingValues) => FieldOption[];

export type CatalogMap = Record<string, CatalogProvider>;
