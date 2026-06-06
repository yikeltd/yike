import type { Property } from "@/types/database";
import { propertyPublicSlug } from "@/lib/property-slugs";
import { SITE_URL } from "@/lib/constants";
import { propertyCanonical } from "@/lib/seo/utils";

/** Public listing path — prefers SEO slug over UUID. */
export function propertyPath(
  property: Pick<Property, "id" | "slug"> &
    Partial<
      Pick<
        Property,
        "bedrooms" | "property_type" | "listing_type" | "area" | "city"
      >
    >
): string {
  return `/properties/${propertyPublicSlug(property)}`;
}

export function propertyAbsoluteUrl(
  property: Pick<Property, "id" | "slug"> &
    Partial<
      Pick<
        Property,
        "bedrooms" | "property_type" | "listing_type" | "area" | "city"
      >
    >
): string {
  return propertyCanonical(propertyPublicSlug(property));
}

export { propertyCanonical };
