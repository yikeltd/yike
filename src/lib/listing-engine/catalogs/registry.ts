import type { CatalogMap, CatalogProvider } from "./types";
import { VEHICLE_CATALOGS } from "./vehicle";
import { PROPERTY_CATALOGS } from "./property";

export const CATALOG_REGISTRY: CatalogMap = {
  ...VEHICLE_CATALOGS,
  ...PROPERTY_CATALOGS,
};

export function getCatalog(id: string): CatalogProvider | undefined {
  return CATALOG_REGISTRY[id];
}

export type { CatalogMap, CatalogProvider };
