import type { ListingPurpose } from "@/lib/pricing/types";

const COMMERCIAL_TYPES = new Set([
  "shop",
  "office",
  "warehouse",
  "commercial_space",
  "commercial",
  "plaza",
  "showroom",
]);

export function listingPurposeFromType(
  listingType: string,
  propertyType: string
): ListingPurpose {
  const lt = listingType.toLowerCase();
  const pt = propertyType.toLowerCase().replace(/\s+/g, "_");
  const commercial = COMMERCIAL_TYPES.has(pt);

  if (lt === "land" || pt === "land") return "land_sale";
  if (lt === "sale") return commercial ? "commercial_sale" : "sale";
  if (commercial) return "commercial_rent";
  return "rent";
}
