export type HomeMarketplaceCategory = "property" | "vehicle";

/**
 * Parse marketplace category from URL/query.
 * Default is **vehicle** (Day-1 primary marketplace). Explicit `property` deep links preserved.
 */
export function parseHomeCategory(
  raw: string | string[] | undefined | null,
): HomeMarketplaceCategory {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "property" || value === "properties") return "property";
  if (value === "vehicle" || value === "vehicles") return "vehicle";
  return "vehicle";
}

export function homeCategoryQueryValue(
  category: HomeMarketplaceCategory,
): string {
  return category === "vehicle" ? "vehicle" : "property";
}
