import { toSlug } from "@/lib/location-slugs";
import { propertyTypeLabel } from "@/lib/utils";
import type { Property } from "@/types/database";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuidParam(value: string): boolean {
  return UUID_RE.test(value);
}

export type PropertySlugInput = Pick<
  Property,
  "bedrooms" | "property_type" | "listing_type" | "area" | "city"
>;

export function buildPropertySlugBase(input: PropertySlugInput): string {
  const parts: string[] = [];

  if (input.bedrooms > 0) {
    parts.push(`${input.bedrooms}-bedroom`);
  }

  const type = input.property_type
    ? propertyTypeLabel(input.property_type)
        .toLowerCase()
        .replace(/\s+/g, "-")
    : "";
  if (type) parts.push(type);

  if (input.listing_type === "rent") parts.push("for-rent");
  else if (input.listing_type === "sale") parts.push("for-sale");
  else if (input.listing_type === "lease") parts.push("for-lease");
  else if (input.listing_type === "shortlet") parts.push("shortlet");

  if (input.area?.trim()) parts.push(input.area.trim());
  if (input.city?.trim()) parts.push(input.city.trim());

  const raw = parts.join(" ");
  return normalizePropertySlug(raw);
}

export function normalizePropertySlug(raw: string, maxLen = 80): string {
  let slug = toSlug(raw);
  if (!slug) slug = "property";
  if (slug.length > maxLen) {
    slug = slug.slice(0, maxLen).replace(/-+$/, "");
  }
  return slug || "property";
}

export function uniqueSlugCandidate(base: string, attempt: number): string {
  if (attempt <= 1) return base;
  if (attempt <= 20) return `${base}-${attempt}`;
  const suffix = `-yk${Math.random().toString(36).slice(2, 5)}`;
  return `${base}${suffix}`;
}

export function propertyPublicSlug(
  property: Pick<Property, "id" | "slug"> & Partial<PropertySlugInput>
): string {
  if (property.slug) return property.slug;
  if (property.area && property.city) {
    return buildPropertySlugBase(property as PropertySlugInput);
  }
  return property.id;
}
