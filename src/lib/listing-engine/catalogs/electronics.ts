import type { CatalogMap } from "./types";
import {
  ELECTRONICS_CATEGORIES,
  ELECTRONICS_SELLER_CONDITIONS,
  ELECTRONICS_WARRANTY_STATUS,
} from "@/lib/marketplace/electronics-specs";
import {
  electronicsBrandsForCategory,
  electronicsModelsForBrand,
} from "../catalogues/electronics-taxonomy";
import {
  DEVICE_RAM_GB,
  FRIDGE_LITERS,
  GENERATOR_KVA,
  PHONE_STORAGE_GB,
  TV_SCREEN_INCHES,
} from "../catalogues/spec-presets";
import { PROPERTY_CATALOGS } from "./property";

export const ELECTRONICS_CATALOGS: CatalogMap = {
  "electronics.categories": () =>
    ELECTRONICS_CATEGORIES.map((c) => ({ value: c.id, label: c.label })),
  "electronics.brands_for_category": (values) =>
    electronicsBrandsForCategory(String(values.auto_category ?? "")),
  "electronics.models_for_brand": (values) =>
    electronicsModelsForBrand(
      String(values.auto_category ?? ""),
      String(values.brand ?? ""),
    ),
  "electronics.conditions": () =>
    ELECTRONICS_SELLER_CONDITIONS.map((c) => ({ value: c.id, label: c.label })),
  "electronics.warranty_status": () =>
    ELECTRONICS_WARRANTY_STATUS.map((w) => ({ value: w.id, label: w.label })),
  "electronics.storage_presets": () => PHONE_STORAGE_GB,
  "electronics.ram_presets": () => DEVICE_RAM_GB,
  "electronics.screen_presets": () => TV_SCREEN_INCHES,
  "electronics.power_kva_presets": () => GENERATOR_KVA,
  "electronics.capacity_liters_presets": () => FRIDGE_LITERS,
  "electronics.states": PROPERTY_CATALOGS["property.states"],
  "electronics.cities_for_state": PROPERTY_CATALOGS["property.cities_for_state"],
  "electronics.areas_for_city": PROPERTY_CATALOGS["property.areas_for_city"],
};
