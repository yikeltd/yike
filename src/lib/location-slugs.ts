import { nigeriaLocations } from "@/constants/nigeriaLocations";

export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function fromSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export type ResolvedCity = {
  city: string;
  state: string;
  slug: string;
};

export type ResolvedArea = ResolvedCity & {
  area: string;
  areaSlug: string;
};

/** SEO-friendly city slug aliases */
const CITY_ALIASES: Record<string, ResolvedCity> = {
  lagos: { city: "Lagos", state: "Lagos", slug: "lagos" },
  abuja: { city: "Abuja", state: "FCT", slug: "abuja" },
  "port-harcourt": {
    city: "Port Harcourt",
    state: "Rivers",
    slug: "port-harcourt",
  },
  enugu: { city: "Enugu", state: "Enugu", slug: "enugu" },
  aba: { city: "Aba", state: "Abia", slug: "aba" },
  owerri: { city: "Owerri", state: "Imo", slug: "owerri" },
  uyo: { city: "Uyo", state: "Akwa Ibom", slug: "uyo" },
  "benin-city": { city: "Benin City", state: "Edo", slug: "benin-city" },
  ibadan: { city: "Ibadan", state: "Oyo", slug: "ibadan" },
  asaba: { city: "Asaba", state: "Delta", slug: "asaba" },
};

const citySlugIndex = new Map<string, ResolvedCity>();
const areaSlugIndex = new Map<string, ResolvedArea>();

function registerCity(city: string, state: string) {
  const slug = toSlug(city);
  if (!citySlugIndex.has(slug)) {
    citySlugIndex.set(slug, { city, state, slug });
  }
}

function registerArea(city: string, state: string, area: string) {
  const citySlug = toSlug(city);
  const areaSlug = toSlug(area);
  const key = `${citySlug}/${areaSlug}`;
  if (!areaSlugIndex.has(key)) {
    areaSlugIndex.set(key, {
      city,
      state,
      slug: citySlug,
      area,
      areaSlug,
    });
  }
}

function buildSlugIndexes() {
  for (const [state, { cities }] of Object.entries(nigeriaLocations)) {
    for (const [city, areas] of Object.entries(cities)) {
      registerCity(city, state);
      registerArea(city, state, city);
      for (const area of areas) {
        registerArea(city, state, area);
      }
    }
  }
  registerCity("Lagos", "Lagos");
  registerCity("Abuja", "FCT");
  for (const alias of Object.values(CITY_ALIASES)) {
    registerCity(alias.city, alias.state);
  }
  const lagosDistricts = nigeriaLocations.Lagos?.cities ?? {};
  for (const [district, subs] of Object.entries(lagosDistricts)) {
    registerArea("Lagos", "Lagos", district);
    for (const sub of subs) {
      registerArea("Lagos", "Lagos", sub);
    }
  }
}

buildSlugIndexes();

export function resolveCitySlug(slug: string): ResolvedCity | null {
  return CITY_ALIASES[slug] ?? citySlugIndex.get(slug) ?? null;
}

export function resolveAreaSlug(
  citySlug: string,
  areaSlug: string
): ResolvedArea | null {
  return areaSlugIndex.get(`${citySlug}/${areaSlug}`) ?? null;
}

export function getSeoCityPaths(): { citySlug: string }[] {
  const slugs = new Set<string>(Object.keys(CITY_ALIASES));
  for (const key of citySlugIndex.keys()) slugs.add(key);
  return [...slugs].map((citySlug) => ({ citySlug }));
}

export function getSeoAreaPaths(): { citySlug: string; areaSlug: string }[] {
  const paths: { citySlug: string; areaSlug: string }[] = [];
  for (const [key] of areaSlugIndex) {
    const [citySlug, areaSlug] = key.split("/");
    if (citySlug && areaSlug) paths.push({ citySlug, areaSlug });
  }
  return paths.slice(0, 150);
}
