import { POPULAR_AREAS } from "@/constants/popularAreas";
import { TRENDING_CITIES } from "@/constants/trendingCities";
import {
  PRIORITY_PROPERTY_TYPE_SLUGS,
  resolveSeoPropertyType,
} from "@/constants/seoPropertyTypes";
import {
  getSeoAreaPaths,
  getSeoCityPaths,
  resolveAreaSlug,
  resolveCitySlug,
  toSlug,
} from "@/lib/location-slugs";
import { getAllBlogSlugs } from "@/constants/blogTopics";

/** Priority cities — major markets first */
const PRIORITY_CITY_SLUGS = [
  ...new Set([
    ...TRENDING_CITIES.map((c) => c.slug),
    "lagos",
    "abuja",
    "port-harcourt",
    "enugu",
    "aba",
    "owerri",
    "uyo",
    "ibadan",
    "benin-city",
    "asaba",
    "kano",
    "kaduna",
    "calabar",
    "onitsha",
    "warri",
    "jos",
    "abeokuta",
    "akure",
    "ilorin",
    "makurdi",
  ]),
];

const MAX_CITIES = 55;
const MAX_NEIGHBORHOODS = 320;
const MAX_PROPERTY_TYPE_PAGES = 380;

export function getHousesCityParams(): { city: string }[] {
  const fromIndex = getSeoCityPaths().map((p) => p.citySlug);
  const merged = [...new Set([...PRIORITY_CITY_SLUGS, ...fromIndex])];
  return merged.slice(0, MAX_CITIES).map((city) => ({ city }));
}

function neighborhoodPriority(citySlug: string, areaSlug: string): number {
  const popular = POPULAR_AREAS.find(
    (a) => toSlug(a.city) === citySlug && toSlug(a.area) === areaSlug
  );
  return popular ? 0 : 1;
}

export function getHousesNeighborhoodParams(): {
  city: string;
  neighborhood: string;
}[] {
  const seen = new Set<string>();
  const paths: { city: string; neighborhood: string; rank: number }[] = [];

  for (const area of POPULAR_AREAS) {
    const city = toSlug(area.city);
    const neighborhood = toSlug(area.area);
    if (!resolveCitySlug(city) || !resolveAreaSlug(city, neighborhood)) continue;
    const key = `${city}/${neighborhood}`;
    if (seen.has(key)) continue;
    seen.add(key);
    paths.push({ city, neighborhood, rank: 0 });
  }

  for (const { city: citySlug } of getHousesCityParams()) {
    const resolved = resolveCitySlug(citySlug);
    if (!resolved) continue;
    for (const area of POPULAR_AREAS.filter((a) => toSlug(a.city) === citySlug)) {
      const neighborhood = toSlug(area.area);
      const key = `${citySlug}/${neighborhood}`;
      if (seen.has(key)) continue;
      if (!resolveAreaSlug(citySlug, neighborhood)) continue;
      seen.add(key);
      paths.push({ city: citySlug, neighborhood, rank: 0 });
    }
  }

  for (const { citySlug, areaSlug } of getSeoAreaPaths()) {
    const key = `${citySlug}/${areaSlug}`;
    if (seen.has(key)) continue;
    if (!resolveAreaSlug(citySlug, areaSlug)) continue;
    seen.add(key);
    paths.push({
      city: citySlug,
      neighborhood: areaSlug,
      rank: neighborhoodPriority(citySlug, areaSlug),
    });
  }

  paths.sort((a, b) => a.rank - b.rank);
  return paths.slice(0, MAX_NEIGHBORHOODS).map(({ city, neighborhood }) => ({
    city,
    neighborhood,
  }));
}

export function getHousesPropertyTypeParams(): {
  city: string;
  neighborhood: string;
  propertyType: string;
}[] {
  const out: { city: string; neighborhood: string; propertyType: string }[] = [];
  const neighborhoods = getHousesNeighborhoodParams();

  for (const { city, neighborhood } of neighborhoods) {
    for (const typeSlug of PRIORITY_PROPERTY_TYPE_SLUGS) {
      if (!resolveSeoPropertyType(typeSlug)) continue;
      out.push({ city, neighborhood, propertyType: typeSlug });
      if (out.length >= MAX_PROPERTY_TYPE_PAGES) return out;
    }
  }
  return out;
}

export function getBlogParams(): { slug: string }[] {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export function countSeoPages(): {
  cities: number;
  neighborhoods: number;
  propertyTypes: number;
  blog: number;
  total: number;
} {
  const cities = getHousesCityParams().length;
  const neighborhoods = getHousesNeighborhoodParams().length;
  const propertyTypes = getHousesPropertyTypeParams().length;
  const blog = getAllBlogSlugs().length;
  return {
    cities,
    neighborhoods,
    propertyTypes,
    blog,
    total: cities + neighborhoods + propertyTypes + blog,
  };
}
