import { POPULAR_AREAS } from "@/constants/popularAreas";
import { TRENDING_CITIES } from "@/constants/trendingCities";
import { intentInCityPath } from "@/lib/seo/intent-in-city";
import { toSlug } from "@/lib/location-slugs";

export type PopularSearchLink = { label: string; href: string };

export type HomePopularSearchContext = {
  listingType?: string;
  hub?: string;
  city?: string;
  area?: string;
};

export type HomePopularSearchBundle = {
  title: string;
  description: string;
  primary: PopularSearchLink[];
  extra: PopularSearchLink[];
};

/** Full list for JSON-LD — not shown in UI by default. */
export const HOME_SEO_SEARCH_LINKS: PopularSearchLink[] = [
  ...TRENDING_CITIES.slice(0, 8).map((city) => ({
    label: `Houses in ${city.name}`,
    href: city.seoPath,
  })),
  ...POPULAR_AREAS.slice(0, 8).map((area) => ({
    label: `${area.area}, ${area.city}`,
    href: area.seoPath,
  })),
];

const BUY_CITIES = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Enugu", "Asaba"];

function citySearchHref(city: string, params: Record<string, string> = {}) {
  const p = new URLSearchParams({ city, ...params });
  return `/search?${p.toString()}`;
}

function dedupeLinks(links: PopularSearchLink[]): PopularSearchLink[] {
  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.href)) return false;
    seen.add(link.href);
    return true;
  });
}

function areasForCity(city: string, limit = 6): PopularSearchLink[] {
  return POPULAR_AREAS.filter((a) => a.city === city)
    .slice(0, limit)
    .map((a) => ({
      label: `${a.area}, ${a.city}`,
      href: a.seoPath,
    }));
}

function citiesAsLinks(
  mode: "rent" | "buy" | "land" | "shortlet",
  names: string[],
  limit: number
): PopularSearchLink[] {
  return names.slice(0, limit).map((name) => {
    const meta = TRENDING_CITIES.find((c) => c.searchCity === name);
    if (mode === "buy") {
      return {
        label: `Buy in ${name}`,
        href: meta?.buyInPath ?? intentInCityPath("buy", toSlug(name)),
      };
    }
    if (mode === "land") {
      return {
        label: `Land in ${name}`,
        href: meta?.landInPath ?? intentInCityPath("land", toSlug(name)),
      };
    }
    if (mode === "shortlet") {
      return {
        label: `Shortlets in ${name}`,
        href: citySearchHref(name, { type: "shortlet" }),
      };
    }
    return {
      label: `Rent in ${name}`,
      href: meta?.rentInPath ?? intentInCityPath("rent", toSlug(name)),
    };
  });
}

function resolveMode(context: HomePopularSearchContext) {
  if (context.hub === "land_sale") return "land" as const;
  if (context.listingType === "sale") return "buy" as const;
  if (context.listingType === "shortlet") return "shortlet" as const;
  return "rent" as const;
}

export function buildHomePopularSearches(
  context: HomePopularSearchContext
): HomePopularSearchBundle {
  const mode = resolveMode(context);
  const city = context.city?.trim();
  const area = context.area?.trim();

  if (city) {
    const cityAreas = areasForCity(city, 8);
    const primary = area
      ? cityAreas.filter((l) => !l.label.toLowerCase().startsWith(`${area.toLowerCase()},`)).slice(0, 4)
      : cityAreas.slice(0, 4);

    const extra = dedupeLinks([
      ...cityAreas.slice(primary.length),
      ...citiesAsLinks(
        mode,
        TRENDING_CITIES.map((c) => c.searchCity).filter((c) => c !== city),
        4
      ),
    ]);

    const modeLabel =
      mode === "buy"
        ? "sale listings"
        : mode === "land"
          ? "land"
          : mode === "shortlet"
            ? "shortlets"
            : "rentals";

    return {
      title: area ? `More in ${area}, ${city}` : `Popular areas in ${city}`,
      description: `Browse verified ${modeLabel} in ${city} and nearby markets.`,
      primary: primary.length > 0 ? primary : citiesAsLinks(mode, [city], 1),
      extra,
    };
  }

  if (mode === "buy") {
    const primary = citiesAsLinks("buy", BUY_CITIES, 4);
    const extra = dedupeLinks([
      ...citiesAsLinks("buy", BUY_CITIES, BUY_CITIES.length).slice(4),
      ...POPULAR_AREAS.slice(0, 6).map((a) => ({
        label: `Buy · ${a.area}, ${a.city}`,
        href: `/search?hub=buy&city=${encodeURIComponent(a.city)}&area=${encodeURIComponent(a.area)}`,
      })),
    ]);

    return {
      title: "Popular places to buy",
      description:
        "Active sale markets across Nigeria — inspect in person and verify title before payment.",
      primary,
      extra,
    };
  }

  if (mode === "land") {
    const names = ["Lagos", "Abuja", "Port Harcourt", "Owerri", "Enugu", "Aba"];
    const primary = citiesAsLinks("land", names, 4);
    const extra = citiesAsLinks("land", names, names.length).slice(4);

    return {
      title: "Popular land searches",
      description: "Plots and land for sale in verified markets.",
      primary,
      extra,
    };
  }

  if (mode === "shortlet") {
    const names = ["Lagos", "Abuja", "Port Harcourt", "Uyo", "Enugu", "Owerri"];
    const primary = citiesAsLinks("shortlet", names, 4);
    const extra = dedupeLinks([
      ...citiesAsLinks("shortlet", names, names.length).slice(4),
      ...areasForCity("Lagos", 3),
    ]);

    return {
      title: "Popular shortlet searches",
      description: "Furnished stays in high-demand cities.",
      primary,
      extra,
    };
  }

  const tier2 = ["Aba", "Enugu", "Owerri", "Lagos"];
  const primary = citiesAsLinks("rent", tier2, 4);
  const extra = dedupeLinks([
    ...TRENDING_CITIES.map((c) => c.searchCity)
      .filter((name) => !tier2.includes(name))
      .slice(0, 4)
      .flatMap((name) => citiesAsLinks("rent", [name], 1)),
    ...POPULAR_AREAS.slice(0, 8).map((a) => ({
      label: `${a.area}, ${a.city}`,
      href: a.seoPath,
    })),
  ]);

  return {
    title: "Popular property searches",
    description:
      "Quick links to trusted rentals and neighborhoods — expand when you want more.",
    primary,
    extra,
  };
}

export function hasActiveHomeSearchContext(context: HomePopularSearchContext) {
  return Boolean(
    context.listingType ||
      context.hub ||
      context.city ||
      context.area
  );
}
