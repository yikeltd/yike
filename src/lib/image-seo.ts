import type { Property } from "@/types/database";
import { listingTypeLabel, propertyTypeLabel } from "@/lib/utils";

/** SEO-friendly alt text for listing images. */
export function listingImageAlt(
  property: Pick<
    Property,
    "title" | "bedrooms" | "property_type" | "area" | "city" | "listing_type"
  >,
  index = 0
): string {
  const beds =
    property.bedrooms > 0
      ? `${property.bedrooms} bedroom `
      : "";
  const type = propertyTypeLabel(property.property_type);
  const intent = listingTypeLabel(property.listing_type).toLowerCase();
  const location = `${property.area} ${property.city}`;

  if (index === 0) {
    return `${beds}${type} for ${intent} in ${location} — ${property.title}`;
  }
  return `${property.title} photo ${index + 1} — ${location}`;
}

/** Suggested filename slug for uploads (reference only). */
export function listingImageFilenameSlug(
  property: Pick<Property, "id" | "area" | "city" | "property_type">
): string {
  const slug = [property.area, property.city, property.property_type, property.id.slice(0, 8)]
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug;
}
