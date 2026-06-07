import { nigeriaLocations } from "@/constants/nigeriaLocations";
import { getLgasForState } from "@/constants/nigeriaLgas";

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

export type ResolvedLga = {
  state: string;
  stateSlug: string;
  lga: string;
  lgaSlug: string;
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
const stateSlugIndex = new Map<string, string>();
const lgaSlugIndex = new Map<string, ResolvedLga>();

/** Common SEO aliases for LGAs (unofficial vs official names). */
const LGA_ALIASES: Record<string, ResolvedLga> = {
  "anambra/orumba-east": {
    state: "Anambra",
    stateSlug: "anambra",
    lga: "Orumba North",
    lgaSlug: "orumba-east",
  },
};

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

  for (const [state, { cities }] of Object.entries(nigeriaLocations)) {
    const stateSlug = toSlug(state);
    if (!stateSlugIndex.has(stateSlug)) {
      stateSlugIndex.set(stateSlug, state);
    }
    for (const lga of getLgasForState(state)) {
      const lgaSlug = toSlug(lga);
      const key = `${stateSlug}/${lgaSlug}`;
      if (!lgaSlugIndex.has(key)) {
        lgaSlugIndex.set(key, { state, stateSlug, lga, lgaSlug });
      }
      for (const [city] of Object.entries(cities)) {
        registerArea(city, state, lga);
      }
    }
  }

  for (const [key, alias] of Object.entries(LGA_ALIASES)) {
    lgaSlugIndex.set(key, alias);
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

export function resolveStateSlug(slug: string): string | null {
  return stateSlugIndex.get(slug) ?? null;
}

export function resolveLgaSlug(
  stateSlug: string,
  lgaSlug: string
): ResolvedLga | null {
  return (
    LGA_ALIASES[`${stateSlug}/${lgaSlug}`] ??
    lgaSlugIndex.get(`${stateSlug}/${lgaSlug}`) ??
    null
  );
}

export function getSeoLgaPaths(): { stateSlug: string; lgaSlug: string }[] {
  const paths: { stateSlug: string; lgaSlug: string }[] = [];
  for (const [key] of lgaSlugIndex) {
    const [stateSlug, lgaSlug] = key.split("/");
    if (stateSlug && lgaSlug) paths.push({ stateSlug, lgaSlug });
  }
  return paths.slice(0, 600);
}

export function getSeoAreaPaths(): { citySlug: string; areaSlug: string }[] {
  const paths: { citySlug: string; areaSlug: string }[] = [];
  for (const [key] of areaSlugIndex) {
    const [citySlug, areaSlug] = key.split("/");
    if (citySlug && areaSlug) paths.push({ citySlug, areaSlug });
  }
  return paths.slice(0, 400);
}
