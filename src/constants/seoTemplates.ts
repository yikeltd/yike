import type { SeoPropertyType } from "./seoPropertyTypes";

export type SeoPageLevel = "city" | "neighborhood" | "propertyType";

export function seoTitle(
  level: SeoPageLevel,
  city: string,
  neighborhood?: string,
  propertyType?: SeoPropertyType
): string {
  if (level === "propertyType" && neighborhood && propertyType) {
    return `${propertyType.label} for Rent in ${neighborhood}, ${city} | Yike`;
  }
  if (level === "neighborhood" && neighborhood) {
    return `Apartments for Rent in ${neighborhood}, ${city} | Verified Listings on Yike`;
  }
  return `Houses and Apartments for Rent in ${city} | Yike`;
}

export function seoDescription(
  level: SeoPageLevel,
  city: string,
  neighborhood?: string,
  propertyType?: SeoPropertyType
): string {
  if (level === "propertyType" && neighborhood && propertyType) {
    return `Find verified ${propertyType.label.toLowerCase()} listings in ${neighborhood}, ${city}. Compare prices, view photos and contact trusted agents on WhatsApp.`;
  }
  if (level === "neighborhood" && neighborhood) {
    return `Browse verified apartments, self contains, mini flats, shops and homes for rent in ${neighborhood}, ${city}. Contact trusted agents directly on WhatsApp.`;
  }
  return `Find verified houses, flats, self contain rooms, shops, shortlets and apartments for rent in ${city}. Explore trusted listings, compare prices and chat with agents on WhatsApp.`;
}

export function seoH1(
  level: SeoPageLevel,
  city: string,
  neighborhood?: string,
  propertyType?: SeoPropertyType
): string {
  if (level === "propertyType" && neighborhood && propertyType) {
    return `${propertyType.label} for Rent in ${neighborhood}, ${city}`;
  }
  if (level === "neighborhood" && neighborhood) {
    return `Apartments and Houses for Rent in ${neighborhood}, ${city}`;
  }
  return `Find Houses and Apartments in ${city}`;
}
