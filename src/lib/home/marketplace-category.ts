export type HomeMarketplaceCategory = "property" | "vehicle" | "electronics";

/**
 * Parse marketplace category from URL/query.
 * Default is **vehicle** (Day-1 primary marketplace). Explicit deep links preserved.
 */
export function parseHomeCategory(
  raw: string | string[] | undefined | null,
): HomeMarketplaceCategory {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "property" || value === "properties") return "property";
  if (value === "vehicle" || value === "vehicles") return "vehicle";
  if (value === "electronics" || value === "electronic") return "electronics";
  return "vehicle";
}

export function homeCategoryQueryValue(category: HomeMarketplaceCategory): string {
  if (category === "vehicle") return "vehicle";
  if (category === "electronics") return "electronics";
  return "property";
}
