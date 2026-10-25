import type { CatalogMap } from "./types";
import {
  ELECTRONICS_CATEGORIES,
  ELECTRONICS_SELLER_CONDITIONS,
  ELECTRONICS_WARRANTY_STATUS,
} from "@/lib/marketplace/electronics-specs";
import { PROPERTY_CATALOGS } from "./property";

export const ELECTRONICS_CATALOGS: CatalogMap = {
  "electronics.categories": () =>
    ELECTRONICS_CATEGORIES.map((c) => ({ value: c.id, label: c.label })),
  "electronics.conditions": () =>
    ELECTRONICS_SELLER_CONDITIONS.map((c) => ({ value: c.id, label: c.label })),
  "electronics.warranty_status": () =>
    ELECTRONICS_WARRANTY_STATUS.map((w) => ({ value: w.id, label: w.label })),
  "electronics.states": PROPERTY_CATALOGS["property.states"],
  "electronics.cities_for_state": PROPERTY_CATALOGS["property.cities_for_state"],
  "electronics.areas_for_city": PROPERTY_CATALOGS["property.areas_for_city"],
};
