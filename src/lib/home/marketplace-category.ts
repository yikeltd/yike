export type HomeMarketplaceCategory = "property" | "vehicle";

export function parseHomeCategory(
  raw: string | string[] | undefined | null,
): HomeMarketplaceCategory {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "vehicle" || value === "vehicles") return "vehicle";
  return "property";
}

export function homeCategoryQueryValue(
  category: HomeMarketplaceCategory,
): string {
  return category === "vehicle" ? "vehicle" : "property";
}
