import type { ListingTypeValue } from "@/constants/listingTypes";
import {
  getCategoriesByGroup,
  type PropertyCategoryGroup,
  PROPERTY_CATEGORIES,
} from "@/constants/propertyCategories";
import type { AmenityId } from "@/constants/amenities";

const LAND_TYPES = new Set([
  "land",
  "land_residential",
  "land_commercial",
  "land_farm",
]);

const COMMERCIAL_TYPES = new Set([
  "shop",
  "office",
  "plaza",
  "warehouse",
  "event_center",
]);

export function propertyCategoryGroup(value: string): PropertyCategoryGroup | null {
  return PROPERTY_CATEGORIES.find((c) => c.value === value)?.group ?? null;
}

export function isLandProperty(value: string): boolean {
  return LAND_TYPES.has(value) || propertyCategoryGroup(value) === "land";
}

export function isCommercialProperty(value: string): boolean {
  return COMMERCIAL_TYPES.has(value) || propertyCategoryGroup(value) === "commercial";
}

export function showRoomFields(propertyType: string, listingType: ListingTypeValue): boolean {
  if (isLandProperty(propertyType)) return false;
  if (isCommercialProperty(propertyType)) return false;
  if (listingType === "sale" && isLandProperty(propertyType)) return false;
  return true;
}

export function groupsForListingType(listingType: ListingTypeValue): PropertyCategoryGroup[] {
  const map: Record<ListingTypeValue, PropertyCategoryGroup[]> = {
    rent: ["residential", "commercial", "student"],
    lease: ["land", "commercial", "residential"],
    sale: ["land", "residential", "commercial"],
    shortlet: ["shortlet", "residential"],
  };
  return map[listingType];
}

export function propertyTypesForGroup(group: PropertyCategoryGroup) {
  return getCategoriesByGroup(group);
}

const PRIMARY_AMENITIES: AmenityId[] = [
  "prepaid_meter",
  "borehole",
  "parking",
  "security",
  "furnished",
  "wifi",
];

const SHORTLET_AMENITIES: AmenityId[] = ["furnished", "wifi", "ac", "serviced"];

const COMMERCIAL_AMENITIES: AmenityId[] = [
  "has_toilet",
  "parking",
  "security",
  "generator",
];

const LAND_AMENITIES: AmenityId[] = ["gated_estate", "security"];

export function amenityBuckets(
  listingType: ListingTypeValue,
  propertyType: string
): { primary: AmenityId[]; more: AmenityId[] } {
  let primary = PRIMARY_AMENITIES;
  if (listingType === "shortlet") primary = SHORTLET_AMENITIES;
  else if (isCommercialProperty(propertyType)) primary = COMMERCIAL_AMENITIES;
  else if (isLandProperty(propertyType)) primary = LAND_AMENITIES;

  const all = [
    "prepaid_meter",
    "borehole",
    "generator",
    "pop_ceiling",
    "tiled",
    "parking",
    "security",
    "gated_estate",
    "furnished",
    "wifi",
    "ac",
    "serviced",
    "boys_quarters",
    "water_heater",
  ] as AmenityId[];

  const more = all.filter((id) => !primary.includes(id));
  return { primary, more };
}
