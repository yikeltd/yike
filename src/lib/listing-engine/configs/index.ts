import type { ListingCategoryConfig } from "../types";
import { VEHICLES_LISTING_CONFIG } from "./vehicles";
import { PROPERTIES_LISTING_CONFIG } from "./properties";

export const CATEGORY_REGISTRY: Record<string, ListingCategoryConfig> = {
  vehicles: VEHICLES_LISTING_CONFIG,
  properties: PROPERTIES_LISTING_CONFIG,
};

export function getCategoryConfig(categoryId: string): ListingCategoryConfig {
  const config = CATEGORY_REGISTRY[categoryId];
  if (!config) {
    throw new Error(
      `listing-engine/configs: unknown category "${categoryId}". Supported: ${Object.keys(CATEGORY_REGISTRY).join(", ")}`,
    );
  }
  return config;
}

export function registerCategoryConfig(config: ListingCategoryConfig): void {
  CATEGORY_REGISTRY[config.id] = config;
}
