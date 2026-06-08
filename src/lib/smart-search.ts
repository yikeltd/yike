import type { PropertySearchParams } from "@/lib/properties";
import type { DiscoverHub } from "@/types/database";
import { PROPERTY_CATEGORIES } from "@/constants/propertyCategories";
import { budgetIndexFromSearchParams } from "@/lib/budget-ranges";
import {
  normalizeLocationQuery,
  parseLocationQuery,
  searchLocations,
  type LocationMatch,
} from "@/lib/location-search";

export type SmartSearchResult = Partial<PropertySearchParams> & {
  resolvedLabel?: string;
  listing_type?: string;
  hub?: DiscoverHub;
};

const PROPERTY_PHRASES: { pattern: RegExp; value: string }[] = [
  { pattern: /\bself\s*contain(s)?\b/i, value: "self_contain" },
  { pattern: /\bmini\s*flat(s)?\b/i, value: "mini_flat" },
  { pattern: /\broom\s*(and|&)\s*parlou?r\b/i, value: "room" },
  { pattern: /\b2\s*bed(room)?\s*flat\b/i, value: "flat_2" },
  { pattern: /\b3\s*bed(room)?\s*flat\b/i, value: "flat_3" },
  { pattern: /\bduplex(es)?\b/i, value: "duplex" },
  { pattern: /\bbungalow(s)?\b/i, value: "bungalow" },
  { pattern: /\bmansion(s)?\b/i, value: "mansion" },
  { pattern: /\bshop(s)?\b/i, value: "shop" },
  { pattern: /\boffice(s)?\s*(space)?\b/i, value: "office" },
  { pattern: /\bwarehouse(s)?\b/i, value: "warehouse" },
  { pattern: /\bhostel(s)?\b/i, value: "hostel" },
  { pattern: /\bhotel(s)?\b/i, value: "hotel" },
  { pattern: /\bguest\s*house(s)?\b/i, value: "guest_house" },
  { pattern: /\bapartment(s)?\b/i, value: "flat" },
  { pattern: /\bflat(s)?\b/i, value: "flat" },
  { pattern: /\bland\b/i, value: "land" },
];

const LISTING_PHRASES: { pattern: RegExp; type?: string; hub?: string; property_type?: string }[] = [
  { pattern: /\bshortlet(s)?\b/i, property_type: "hotel" },
  { pattern: /\bairbnb\b/i, property_type: "hotel" },
  { pattern: /\bhotel(s)?\b/i, property_type: "hotel" },
  { pattern: /\bfor\s*sale\b/i, type: "sale" },
  { pattern: /\bbuy\b/i, type: "sale" },
  { pattern: /\blease\b/i, type: "lease" },
  { pattern: /\brent\b/i, type: "rent" },
];

const BUDGET_PHRASES: { pattern: RegExp; max?: number; min?: number }[] = [
  { pattern: /\b(cheap|affordable|budget)\b/i, max: 500_000 },
  { pattern: /\bunder\s*200k\b/i, max: 200_000 },
  { pattern: /\bunder\s*500k\b/i, max: 500_000 },
  { pattern: /\bunder\s*1m\b/i, max: 1_000_000 },
];

function stripMatchedPhrases(text: string, patterns: RegExp[]): string {
  let out = text;
  for (const p of patterns) {
    out = out.replace(p, " ").replace(/\s+/g, " ").trim();
  }
  return out;
}

/** Parse natural-language queries into structured search params. */
export function parseSmartSearchQuery(raw: string): SmartSearchResult {
  const trimmed = normalizeLocationQuery(raw);
  if (!trimmed) return {};

  let property_type: string | undefined;
  for (const { pattern, value } of PROPERTY_PHRASES) {
    if (pattern.test(trimmed)) {
      property_type = value;
      break;
    }
  }

  let listing_type: string | undefined;
  let hub: DiscoverHub | undefined;
  for (const { pattern, type, hub: h, property_type: listingPropertyType } of LISTING_PHRASES) {
    if (pattern.test(trimmed)) {
      listing_type = type;
      hub = h as DiscoverHub | undefined;
      if (listingPropertyType) property_type = listingPropertyType;
      break;
    }
  }

  let min_price: number | undefined;
  let max_price: number | undefined;
  for (const { pattern, max, min } of BUDGET_PHRASES) {
    if (pattern.test(trimmed)) {
      if (max) max_price = max;
      if (min) min_price = min;
      break;
    }
  }

  const locationText = stripMatchedPhrases(
    trimmed,
    [
      ...PROPERTY_PHRASES.map((p) => p.pattern),
      ...LISTING_PHRASES.map((p) => p.pattern),
      ...BUDGET_PHRASES.map((p) => p.pattern),
      /\b(cheap|affordable|budget)\b/i,
    ]
  );

  const locationParsed = parseLocationQuery(locationText || trimmed);

  const labelParts = [
    locationParsed.bedrooms ? `${locationParsed.bedrooms} bed` : null,
    property_type
      ? PROPERTY_CATEGORIES.find((c) => c.value === property_type)?.label
      : null,
    listing_type,
    locationParsed.resolvedLabel,
  ].filter(Boolean);

  return {
    ...locationParsed,
    property_type: property_type ?? locationParsed.property_type,
    listing_type,
    hub,
    min_price,
    max_price,
    resolvedLabel: labelParts.join(" · ") || trimmed,
  };
}

export type SearchSuggestion =
  | { kind: "location"; label: string; match: LocationMatch }
  | { kind: "query"; label: string; query: string }
  | { kind: "recent"; label: string; href: string }
  | { kind: "trending"; label: string; href: string };

export function getSmartSearchSuggestions(
  query: string,
  extras?: { recent?: { label: string; href: string }[]; trending?: { label: string; href: string }[] }
): SearchSuggestion[] {
  const q = query.trim();
  const out: SearchSuggestion[] = [];

  if (!q) {
    for (const t of extras?.recent?.slice(0, 3) ?? []) {
      out.push({ kind: "recent", label: t.label, href: t.href });
    }
    for (const t of extras?.trending?.slice(0, 4) ?? []) {
      out.push({ kind: "trending", label: t.label, href: t.href });
    }
    return out;
  }

  const parsed = parseSmartSearchQuery(q);
  if (parsed.resolvedLabel && parsed.resolvedLabel !== q) {
    out.push({ kind: "query", label: `Search: ${parsed.resolvedLabel}`, query: q });
  } else {
    out.push({ kind: "query", label: `Search: ${q}`, query: q });
  }

  for (const match of searchLocations(q, 5)) {
    out.push({ kind: "location", label: match.label, match });
  }

  return out.slice(0, 8);
}

export function smartSearchToUrlParams(parsed: SmartSearchResult): URLSearchParams {
  const params = new URLSearchParams();

  if (parsed.hub) params.set("hub", parsed.hub);
  else if (parsed.listing_type) params.set("type", parsed.listing_type);

  if (parsed.property_type === "land" && !parsed.hub) {
    params.set("hub", "land_sale");
  } else if (parsed.property_type) {
    params.set("property_type", parsed.property_type);
  }

  if (parsed.state) params.set("state", parsed.state);
  if (parsed.city) params.set("city", parsed.city);
  if (parsed.area) params.set("area", parsed.area);
  if (parsed.bedrooms) params.set("beds", String(parsed.bedrooms));
  if (parsed.min_price) params.set("min", String(parsed.min_price));
  if (parsed.max_price) params.set("max", String(parsed.max_price));
  if (
    parsed.q &&
    !parsed.city &&
    !parsed.area &&
    !parsed.state
  ) {
    params.set("q", parsed.q);
  }

  return params;
}

/** Search commits always land on /search when filters or query exist. */
export function navigateSearchTarget(pathname: string): "/" | "/search" {
  return pathname.startsWith("/search") ? "/search" : "/search";
}

export function buildSearchHref(
  _pathname: string,
  parsed: SmartSearchResult
): string {
  const params = smartSearchToUrlParams(parsed);
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

export function budgetIndexFromPrices(min?: number, max?: number): number {
  return budgetIndexFromSearchParams(
    min != null ? String(min) : null,
    max != null ? String(max) : null
  );
}
