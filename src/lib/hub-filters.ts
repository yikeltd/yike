import { getAreaProfiles } from "@/constants/areaProfiles";
import { PROPERTY_CATEGORIES } from "@/constants/propertyCategories";
import type { DiscoverHub, Property } from "@/types/database";
import { isVerifiedAgent } from "@/lib/utils";

const STUDENT_TYPES = new Set(
  PROPERTY_CATEGORIES.filter((c) => c.group === "student").map((c) => c.value)
);

export function isTrustVerified(property: Property): boolean {
  return (
    property.is_verified_listing ||
    isVerifiedAgent(property.agent?.verification_status)
  );
}

export function matchesHub(property: Property, hub: DiscoverHub): boolean {
  if (hub === "shortlet") return property.listing_type === "shortlet";

  if (hub === "student") {
    if (STUDENT_TYPES.has(property.property_type ?? "")) return true;
    const profiles = getAreaProfiles(property.city, property.area);
    if (profiles.includes("student")) return true;
    const blob = `${property.title} ${property.description ?? ""}`.toLowerCase();
    return blob.includes("student") || blob.includes("campus") || blob.includes("university");
  }

  if (hub === "affordable") {
    if (Number(property.price) <= 800_000 && property.listing_type === "rent")
      return true;
    const profiles = getAreaProfiles(property.city, property.area);
    return profiles.includes("affordable");
  }

  return true;
}

export function hasAmenity(property: Property, amenity: string): boolean {
  return (property.extras?.amenities ?? []).includes(amenity);
}
