import { POPULAR_AREAS } from "@/constants/popularAreas";
import { TRENDING_CITIES } from "@/constants/trendingCities";
import {
  PRIORITY_PROPERTY_TYPE_SLUGS,
  SEO_PROPERTY_TYPES,
  resolveSeoPropertyType,
} from "@/constants/seoPropertyTypes";
import { toSlug } from "@/lib/location-slugs";

export function getRelatedLocations(city: string, excludeArea?: string, limit = 8) {
  return POPULAR_AREAS.filter(
    (a) =>
      a.city.toLowerCase() === city.toLowerCase() &&
      (!excludeArea || a.area.toLowerCase() !== excludeArea.toLowerCase())
  )
    .slice(0, limit)
    .map((a) => ({
      label: a.area,
      href: `/houses/${toSlug(a.city)}/${toSlug(a.area)}`,
    }));
}

export function getRelatedCities(excludeCitySlug: string, limit = 6) {
  return TRENDING_CITIES.filter((c) => c.slug !== excludeCitySlug)
    .slice(0, limit)
    .map((c) => ({
      label: c.name,
      href: `/houses/${c.slug}`,
    }));
}

export function getRelatedPropertyTypes(
  citySlug: string,
  neighborhoodSlug: string,
  excludeSlug?: string
) {
  return PRIORITY_PROPERTY_TYPE_SLUGS.map((s) => resolveSeoPropertyType(s))
    .filter((t): t is NonNullable<typeof t> => !!t && t.slug !== excludeSlug)
    .map((t) => ({
      label: t.label,
      href: `/houses/${citySlug}/${neighborhoodSlug}/${t.slug}`,
    }));
}

export function getAllSeoPropertyTypes() {
  return SEO_PROPERTY_TYPES;
}
