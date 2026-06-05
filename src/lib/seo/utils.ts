import { SITE_URL } from "@/lib/constants";
import { toSlug, fromSlug } from "@/lib/location-slugs";
import type { SeoPropertyType } from "@/constants/seoPropertyTypes";
import { seoDescription, seoTitle, type SeoPageLevel } from "@/constants/seoTemplates";

export { toSlug as slugify, fromSlug as unslugify };

export function housesCanonical(
  citySlug: string,
  neighborhoodSlug?: string,
  propertyTypeSlug?: string
): string {
  let path = `/houses/${citySlug}`;
  if (neighborhoodSlug) path += `/${neighborhoodSlug}`;
  if (propertyTypeSlug) path += `/${propertyTypeSlug}`;
  return `${SITE_URL}${path}`;
}

export function generateSeoTitle(
  level: SeoPageLevel,
  city: string,
  neighborhood?: string,
  propertyType?: SeoPropertyType
) {
  return seoTitle(level, city, neighborhood, propertyType);
}

export function generateSeoDescription(
  level: SeoPageLevel,
  city: string,
  neighborhood?: string,
  propertyType?: SeoPropertyType
) {
  return seoDescription(level, city, neighborhood, propertyType);
}

export function generateCanonicalUrl(
  citySlug: string,
  neighborhoodSlug?: string,
  propertyTypeSlug?: string
) {
  return housesCanonical(citySlug, neighborhoodSlug, propertyTypeSlug);
}

export type BreadcrumbItem = { label: string; href: string };

export function generateBreadcrumbs(
  city: string,
  citySlug: string,
  neighborhood?: string,
  neighborhoodSlug?: string,
  propertyType?: SeoPropertyType
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Houses", href: "/search" },
    { label: city, href: `/houses/${citySlug}` },
  ];
  if (neighborhood && neighborhoodSlug) {
    items.push({
      label: neighborhood,
      href: `/houses/${citySlug}/${neighborhoodSlug}`,
    });
  }
  if (propertyType && neighborhoodSlug) {
    items.push({
      label: propertyType.label,
      href: `/houses/${citySlug}/${neighborhoodSlug}/${propertyType.slug}`,
    });
  }
  return items;
}

export function blogCanonical(slug: string) {
  return `${SITE_URL}/blog/${slug}`;
}
