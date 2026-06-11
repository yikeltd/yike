import { SITE_URL } from "@/lib/constants";
import type { PropertySearchParams } from "@/lib/property-search";
import { getCityPersonality } from "@/constants/cityPersonalities";
import { TRENDING_CITIES } from "@/constants/trendingCities";
import type { SeoFaq } from "@/lib/seo/content";
import {
  getSeoCitiesGroupedByState,
  type SeoCityEntry,
} from "@/lib/location-slugs";
import { getAllSeoCitySlugs, PRIORITY_CITY_SLUGS } from "@/lib/seo/paths";

export type SeoListingIntent = "rent" | "buy" | "land";

const INTENT_PREFIX: Record<SeoListingIntent, string> = {
  rent: "rent-in-",
  buy: "buy-in-",
  land: "land-in-",
};

const INTENT_LABEL: Record<SeoListingIntent, string> = {
  rent: "Rent",
  buy: "Buy",
  land: "Land",
};

const INTENT_HUB_PATH: Record<SeoListingIntent, string> = {
  rent: "/rent",
  buy: "/buy",
  land: "/land",
};

export function intentInCityPath(intent: SeoListingIntent, citySlug: string): string {
  return `/${INTENT_PREFIX[intent]}${citySlug}`;
}

export function intentInCityUrl(intent: SeoListingIntent, citySlug: string): string {
  return `${SITE_URL}${intentInCityPath(intent, citySlug)}`;
}

export function parseIntentInCityPath(pathname: string): {
  intent: SeoListingIntent;
  citySlug: string;
} | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (!segment) return null;

  for (const intent of ["rent", "buy", "land"] as const) {
    const prefix = INTENT_PREFIX[intent];
    if (!segment.startsWith(prefix)) continue;
    const citySlug = segment.slice(prefix.length);
    if (!citySlug) return null;
    return { intent, citySlug };
  }
  return null;
}

export function isIntentInCityPath(pathname: string): boolean {
  return parseIntentInCityPath(pathname) != null;
}

export function getAllIntentCitySlugs(): string[] {
  return getAllSeoCitySlugs();
}

export function getIntentCityParams(): { intent: SeoListingIntent; city: string }[] {
  const cities = getAllIntentCitySlugs();
  const intents: SeoListingIntent[] = ["rent", "buy", "land"];
  return intents.flatMap((intent) => cities.map((city) => ({ intent, city })));
}

/** Pre-build priority markets only — all others generated on first visit. */
export function getPriorityIntentCityParams(): { intent: SeoListingIntent; city: string }[] {
  const slugs = [
    ...new Set([...TRENDING_CITIES.map((c) => c.slug), ...PRIORITY_CITY_SLUGS]),
  ];
  const intents: SeoListingIntent[] = ["rent", "buy", "land"];
  return intents.flatMap((intent) => slugs.map((city) => ({ intent, city })));
}

export function getIntentCitiesGroupedByState(): { state: string; cities: SeoCityEntry[] }[] {
  return getSeoCitiesGroupedByState();
}

export function intentSearchParams(
  intent: SeoListingIntent,
  city: string
): PropertySearchParams {
  if (intent === "rent") return { city, listing_type: "rent" };
  if (intent === "buy") return { city, listing_type: "sale", hub: "buy" };
  return { city, hub: "land_sale" };
}

export function intentSearchHref(intent: SeoListingIntent, city: string): string {
  const params = new URLSearchParams({ city });
  if (intent === "rent") params.set("type", "rent");
  if (intent === "buy") {
    params.set("type", "sale");
    params.set("hub", "buy");
  }
  if (intent === "land") params.set("hub", "land_sale");
  return `/search?${params.toString()}`;
}

function locationLabel(city: string, state: string): string {
  if (city === state || state === "FCT") return city;
  return `${city}, ${state}`;
}

export function intentSeoTitle(
  intent: SeoListingIntent,
  city: string,
  state: string
): string {
  const place = locationLabel(city, state);
  if (intent === "rent") return `Rent in ${place} | Verified Rentals | Yike`;
  if (intent === "buy") return `Buy Property in ${place} | Homes for Sale | Yike`;
  return `Land for Sale in ${place} | Plots & Acreage | Yike`;
}

export function intentSeoDescription(
  intent: SeoListingIntent,
  city: string,
  state: string
): string {
  const place = locationLabel(city, state);
  if (intent === "rent") {
    return `Browse verified rentals in ${place} — self contains, flats, shops and family homes. Compare prices, view photos and contact agents on WhatsApp.`;
  }
  if (intent === "buy") {
    return `Homes and investment property for sale in ${place}. Duplexes, bungalows and apartments from verified agents — inspect before you pay.`;
  }
  return `Land and plots for sale in ${place}. Residential and commercial listings from verified agents — verify title with your lawyer before payment.`;
}

export function intentSeoH1(intent: SeoListingIntent, city: string, state: string): string {
  const place = locationLabel(city, state);
  if (intent === "rent") return `Rent in ${place}`;
  if (intent === "buy") return `Buy Property in ${place}`;
  return `Land for Sale in ${place}`;
}

export function intentListingsHeading(
  intent: SeoListingIntent,
  city: string,
  count: number
): string {
  const noun =
    intent === "rent" ? "rental" : intent === "buy" ? "property" : "land listing";
  if (count > 0) {
    return `${count} verified ${noun}${count === 1 ? "" : "s"} in ${city}`;
  }
  if (intent === "rent") return `Rentals in ${city}`;
  if (intent === "buy") return `Homes for sale in ${city}`;
  return `Land listings in ${city}`;
}

export function intentHeroVibe(intent: SeoListingIntent, state: string): string {
  const hub = INTENT_LABEL[intent];
  const stateLabel = state === "FCT" ? "Abuja FCT" : state;
  return `${hub} · ${stateLabel}`;
}

export function buildIntentCityIntro(
  intent: SeoListingIntent,
  city: string,
  state: string
): string[] {
  const personality = getCityPersonality(city);
  const place = locationLabel(city, state);

  if (intent === "rent") {
    return [
      `Find a place to rent in ${place} without the usual guesswork. Yike shows verified listings from identity-checked agents — self contains, mini flats, family apartments and shop spaces.`,
      personality.rentalGuide,
      `Save listings, compare prices and reach agents on WhatsApp. Yike does not collect rent or hold deposits — you inspect the property and agree payment terms directly.`,
      `Start with the homes below, or open search to filter by neighborhood, bedrooms and budget.`,
    ];
  }
  if (intent === "buy") {
    return [
      `Shopping for property in ${place}? Browse homes for sale — duplexes, bungalows, terraces and apartments — from verified agents on Yike.`,
      `Before any large transfer, inspect in person and run title verification with a qualified property lawyer. Yike checks agent identity; ownership documents are between you and your counsel.`,
      personality.rentalGuide,
      `Use the listings below or refine search by area, property type and price range.`,
    ];
  }
  return [
    `Looking for land in ${place}? Compare residential plots, estate allocations and commercial corners listed by verified agents.`,
    `Visit the plot, confirm survey coordinates and title type (C of O, Gazette, Deed of Assignment) before payment. Yike does not guarantee ownership — due diligence is essential.`,
    `Contact agents on WhatsApp to arrange inspection. For lease or farm land, use search filters in ${city}.`,
    `Listings are added regularly — check back or set a property request if you do not see your area yet.`,
  ];
}

export function buildIntentCityFaqs(
  intent: SeoListingIntent,
  city: string,
  state: string
): SeoFaq[] {
  const place = locationLabel(city, state);
  const base = getCityPersonality(city).faqs;

  if (intent === "rent") {
    return [
      {
        q: `How much does rent cost in ${place}?`,
        a: "It depends on neighborhood, property type and finish. Compare several listings on Yike and inspect in person — unusually cheap offers without a viewing are a red flag.",
      },
      {
        q: `Are Yike agents verified in ${city}?`,
        a: "Verified badges mean the agent passed Yike identity checks. You should still view the property and confirm terms before paying caution or rent.",
      },
      ...base.slice(0, 2),
    ];
  }
  if (intent === "buy") {
    return [
      {
        q: `What should I verify before buying in ${place}?`,
        a: "Physical inspection, survey plan match, title search with a lawyer, and seller identity matching the documents.",
      },
      {
        q: "Does Yike guarantee property title?",
        a: "No. We help you discover listings and verified agents. Legal title work is your responsibility with qualified counsel.",
      },
      ...base.slice(0, 2),
    ];
  }
  return [
    {
      q: `Is it safe to buy land in ${place} online?`,
      a: "Treat listings as leads only. Inspect the plot, verify title and survey with a lawyer, then pay — never rush because of pressure or remote-only deals.",
    },
    {
      q: "What types of land are listed?",
      a: "Residential plots, estate allocations and commercial land. Use search filters for land_sale in your target area of " + city + ".",
    },
    ...base.slice(0, 2),
  ];
}

export function intentLabel(intent: SeoListingIntent): string {
  return INTENT_LABEL[intent];
}

export function intentHubPath(intent: SeoListingIntent): string {
  return INTENT_HUB_PATH[intent];
}

export function siblingIntentLinks(
  citySlug: string,
  city: string,
  current: SeoListingIntent
): { label: string; href: string }[] {
  const intents: SeoListingIntent[] = ["rent", "buy", "land"];
  return intents
    .filter((i) => i !== current)
    .map((intent) => ({
      label: `${INTENT_LABEL[intent]} in ${city}`,
      href: intentInCityPath(intent, citySlug),
    }));
}

export function intentDirectoryTitle(intent: SeoListingIntent): string {
  if (intent === "rent") return "Rent a home in every Nigerian city";
  if (intent === "buy") return "Buy property in every Nigerian city";
  return "Land for sale in every Nigerian city";
}

export function intentDirectoryDescription(intent: SeoListingIntent, total: number): string {
  if (intent === "rent") {
    return `Browse ${total}+ cities and local government areas. Each page lists verified rentals you can compare and contact on WhatsApp.`;
  }
  if (intent === "buy") {
    return `Explore ${total}+ markets across Nigeria — homes for sale from verified agents, with safety guidance on every page.`;
  }
  return `Find land listings in ${total}+ cities and LGAs. Always verify title on site before you pay.`;
}
