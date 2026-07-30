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
import { VEHICLE_MAKES, VEHICLE_MAKE_TYPES } from "@/lib/marketplace/vehicle-makes";

export type SmartSearchResult = Partial<PropertySearchParams> & {
  resolvedLabel?: string;
  listing_type?: string;
  hub?: DiscoverHub;
  /** Vertical identification */
  vertical?: "property" | "vehicle" | "agent" | "land" | "shortlet";
  /** Vehicle marketplace signals */
  make?: string;
  model?: string;
  body_type?: string;
  vehicle_condition?: string;
  /** Agent search signals */
  agent_role?: string;
  agent_verified?: boolean;
  /** When true, caller should switch marketplace location context */
  switchesLocation?: boolean;
};

const PROPERTY_PHRASES: { pattern: RegExp; value: string }[] = [
  { pattern: /\bself\s*contain(s)?\b/i, value: "self_contain" },
  { pattern: /\bmini\s*flat(s)?\b/i, value: "mini_flat" },
  { pattern: /\broom\s*(and|&)\s*parlou?r\b/i, value: "room" },
  { pattern: /\b1\s*bed(room)?\s*(flat|apartment)?\b/i, value: "flat_1" },
  { pattern: /\b2\s*bed(room)?\s*(flat|apartment)?\b/i, value: "flat_2" },
  { pattern: /\b3\s*bed(room)?\s*(flat|apartment)?\b/i, value: "flat_3" },
  { pattern: /\b4\s*bed(room)?\s*(flat|apartment)?\b/i, value: "flat_4" },
  { pattern: /\bduplex(es)?\b/i, value: "duplex" },
  { pattern: /\bterrace(s)?\b/i, value: "terrace" },
  { pattern: /\bbungalow(s)?\b/i, value: "bungalow" },
  { pattern: /\bmansion(s)?\b/i, value: "mansion" },
  { pattern: /\bshop(s)?\b/i, value: "shop" },
  { pattern: /\boffice(s)?\s*(space)?\b/i, value: "office" },
  { pattern: /\bwarehouse(s)?\b/i, value: "warehouse" },
  { pattern: /\bhostel(s)?\b/i, value: "hostel" },
  { pattern: /\bhotel(s)?\b/i, value: "hotel" },
  { pattern: /\bguest\s*house(s)?\b/i, value: "guest_house" },
  { pattern: /\bapartment(s)?\b/i, value: "flat" },
  { pattern: /\bhouse(s)?\b/i, value: "bungalow" },
  { pattern: /\bflat(s)?\b/i, value: "flat" },
  { pattern: /\bland\b/i, value: "land" },
];

const LISTING_PHRASES: {
  pattern: RegExp;
  type?: string;
  hub?: string;
  property_type?: string;
  vertical?: "property" | "shortlet" | "land";
}[] = [
  { pattern: /\bshortlet(s)?\b/i, property_type: "hotel", vertical: "shortlet" },
  { pattern: /\bairbnb\b/i, property_type: "hotel", vertical: "shortlet" },
  { pattern: /\bfor\s*sale\b/i, type: "sale" },
  { pattern: /\bbuy\b/i, type: "sale" },
  { pattern: /\blease\b/i, type: "lease" },
  { pattern: /\brent\b/i, type: "rent" },
  { pattern: /\bto\s*let\b/i, type: "rent" },
  { pattern: /\bland\s*(for\s*sale)?\b/i, hub: "land_sale", vertical: "land" },
];

const VEHICLE_BODY: { pattern: RegExp; value: string }[] = [
  { pattern: /\bsuv(s)?\b/i, value: "suv" },
  { pattern: /\bsedan(s)?\b/i, value: "sedan" },
  { pattern: /\bhatchback(s)?\b/i, value: "hatchback" },
  { pattern: /\bpick\s*-?\s*up(s)?\b/i, value: "pickup" },
  { pattern: /\btruck(s)?\b/i, value: "truck text-bold" },
  { pattern: /\bbus(es)?\b/i, value: "bus" },
  { pattern: /\bmotorcycle(s)?|bike(s)?\b/i, value: "motorcycle" },
  { pattern: /\btricycle(s)?|keke\b/i, value: "tricycle" },
];

const VEHICLE_CONDITION_PHRASES: { pattern: RegExp; value: string }[] = [
  { pattern: /\b(tokunbo|foreign\s*used)\b/i, value: "foreign_used" },
  { pattern: /\b(nigerian?\s*used|local\s*used)\b/i, value: "nigerian_used" },
  { pattern: /\b(brand\s*new|tear\s*rubber|new)\b/i, value: "brand_new" },
];

const AGENT_PHRASES: { pattern: RegExp; role?: string }[] = [
  { pattern: /\b(agent|realtor|broker)(s)?\b/i, role: "agent" },
  { pattern: /\b(auto\s*dealer|car\s*dealer|showroom)(s)?\b/i, role: "dealer" },
  { pattern: /\b(verifier|field\s*verifier)(s)?\b/i, role: "verifier" },
  { pattern: /\b(legal\s*partner|lawyer)(s)?\b/i, role: "legal" },
];

const BUDGET_PHRASES: { pattern: RegExp; max?: number; min?: number }[] = [
  { pattern: /\b(cheap|affordable|budget)\b/i, max: 1_000_000 },
  { pattern: /\bunder\s*200k\b/i, max: 200_000 },
  { pattern: /\bunder\s*500k\b/i, max: 500_000 },
  { pattern: /\bunder\s*1m\b/i, max: 1_000_000 },
  { pattern: /\bunder\s*5m\b/i, max: 5_000_000 },
  { pattern: /\bunder\s*10m\b/i, max: 10_000_000 },
  { pattern: /\bunder\s*15m\b/i, max: 15_000_000 },
  { pattern: /\bunder\s*20m\b/i, max: 20_000_000 },
  { pattern: /\bunder\s*50m\b/i, max: 50_000_000 },
  { pattern: /\bunder\s*100m\b/i, max: 100_000_000 },
  { pattern: /\bunder\s*250m\b/i, max: 250_000_000 },
  { pattern: /\bunder\s*500m\b/i, max: 500_000_000 },
];

/** Parse ₦20m / under 20m / below 15 million / 20 million naira */
const NAIRA_BUDGET_RE =
  /\b(?:under|below|less\s*than|<)\s*(?:₦|ngn|naira)?\s*(\d+(?:\.\d+)?)\s*(k|m|million|bn|billion)?\b|\b(?:₦|ngn)\s*(\d+(?:\.\d+)?)\s*(k|m|million)?\b|\b(\d+(?:\.\d+)?)\s*(million|m)\b/i;

function parseNairaToken(amount: number, unit?: string): number {
  const u = (unit ?? "").toLowerCase();
  if (u === "k") return Math.round(amount * 1_000);
  if (u === "m" || u === "million") return Math.round(amount * 1_000_000);
  if (u === "bn" || u === "billion") return Math.round(amount * 1_000_000_000);
  if (!u && amount < 1000) return Math.round(amount * 1_000_000);
  return Math.round(amount);
}

function parseBudgetFromText(text: string): {
  min_price?: number;
  max_price?: number;
} {
  for (const { pattern, max, min } of BUDGET_PHRASES) {
    if (pattern.test(text)) {
      return { max_price: max, min_price: min };
    }
  }
  const m = text.match(NAIRA_BUDGET_RE);
  if (!m) return {};
  const amount = Number(m[1] ?? m[3] ?? m[5]);
  const unit = m[2] ?? m[4] ?? m[6];
  if (!Number.isFinite(amount)) return {};
  const max_price = parseNairaToken(amount, unit);
  return { max_price };
}

function stripMatchedPhrases(text: string, patterns: RegExp[]): string {
  let out = text;
  for (const p of patterns) {
    out = out.replace(p, " ").replace(/\s+/g, " ").trim();
  }
  return out;
}

function detectVehicleMakeModel(text: string): {
  make?: string;
  model?: string;
} {
  const lower = text.toLowerCase();
  for (const make of VEHICLE_MAKES) {
    const makeLower = make.toLowerCase();
    if (!lower.includes(makeLower)) continue;
    const models = VEHICLE_MAKE_TYPES[make] ?? [];
    for (const model of models) {
      if (lower.includes(model.toLowerCase())) {
        return { make, model };
      }
    }
    return { make };
  }
  return {};
}

/** Parse natural-language queries into structured search params across all verticals. */
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
  let explicitVertical: "property" | "vehicle" | "agent" | "land" | "shortlet" | undefined;

  for (const {
    pattern,
    type,
    hub: h,
    property_type: listingPropertyType,
    vertical,
  } of LISTING_PHRASES) {
    if (pattern.test(trimmed)) {
      listing_type = type;
      hub = h as DiscoverHub | undefined;
      if (listingPropertyType) property_type = listingPropertyType;
      if (vertical) explicitVertical = vertical;
      break;
    }
  }

  let vehicle_condition: string | undefined;
  for (const { pattern, value } of VEHICLE_CONDITION_PHRASES) {
    if (pattern.test(trimmed)) {
      vehicle_condition = value;
      break;
    }
  }

  let body_type: string | undefined;
  for (const { pattern, value } of VEHICLE_BODY) {
    if (pattern.test(trimmed)) {
      body_type = value;
      break;
    }
  }

  let agent_role: string | undefined;
  for (const { pattern, role } of AGENT_PHRASES) {
    if (pattern.test(trimmed)) {
      agent_role = role;
      explicitVertical = "agent";
      break;
    }
  }

  const { make, model } = detectVehicleMakeModel(trimmed);
  const budget = parseBudgetFromText(trimmed);

  const locationText = stripMatchedPhrases(trimmed, [
    ...PROPERTY_PHRASES.map((p) => p.pattern),
    ...LISTING_PHRASES.map((p) => p.pattern),
    ...BUDGET_PHRASES.map((p) => p.pattern),
    ...VEHICLE_BODY.map((p) => p.pattern),
    ...VEHICLE_CONDITION_PHRASES.map((p) => p.pattern),
    ...AGENT_PHRASES.map((p) => p.pattern),
    NAIRA_BUDGET_RE,
    /\b(cheap|affordable|budget)\b/i,
    ...(make ? [new RegExp(`\\b${make}\\b`, "i")] : []),
    ...(model
      ? [new RegExp(`\\b${model.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i")]
      : []),
  ])
    .replace(/^in\s+/i, "")
    .replace(/\bin\s+/gi, " ")
    .replace(/\bstate\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const locationParsed = parseLocationQuery(locationText || trimmed);

  const isVehicle =
    Boolean(make || model || body_type || vehicle_condition) &&
    !property_type &&
    !listing_type;

  const vertical = explicitVertical || (isVehicle ? "vehicle" : "property");

  const labelParts = [
    make,
    model,
    vehicle_condition ? vehicle_condition.replace(/_/g, " ") : null,
    body_type?.toUpperCase(),
    agent_role ? `${agent_role.toUpperCase()}S` : null,
    locationParsed.bedrooms ? `${locationParsed.bedrooms} bed` : null,
    property_type
      ? PROPERTY_CATEGORIES.find((c) => c.value === property_type)?.label
      : null,
    listing_type,
    budget.max_price
      ? `under ₦${(budget.max_price / 1_000_000).toFixed(
          budget.max_price >= 1_000_000 ? 0 : 1,
        )}m`.replace(".0m", "m")
      : null,
    locationParsed.resolvedLabel,
  ].filter(Boolean);

  const switchesLocation = Boolean(
    locationParsed.city || locationParsed.state || locationParsed.area,
  );

  return {
    ...locationParsed,
    property_type: property_type ?? locationParsed.property_type,
    listing_type,
    hub,
    min_price: budget.min_price,
    max_price: budget.max_price,
    vertical,
    make,
    model,
    body_type,
    vehicle_condition,
    agent_role,
    switchesLocation,
    resolvedLabel: labelParts.join(" · ") || trimmed,
    q:
      !locationParsed.city &&
      !locationParsed.area &&
      !locationParsed.state &&
      !property_type &&
      !make &&
      !body_type &&
      !agent_role
        ? trimmed
        : locationParsed.q,
  };
}

export type SearchSuggestion =
  | { kind: "location"; label: string; match: LocationMatch }
  | { kind: "query"; label: string; query: string }
  | { kind: "recent"; label: string; href: string }
  | { kind: "trending"; label: string; href: string };

export function getSmartSearchSuggestions(
  query: string,
  extras?: {
    recent?: { label: string; href: string }[];
    trending?: { label: string; href: string }[];
  },
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
    out.push({
      kind: "query",
      label: `Search: ${parsed.resolvedLabel}`,
      query: q,
    });
  } else {
    out.push({ kind: "query", label: `Search: ${q}`, query: q });
  }

  for (const match of searchLocations(q, 5)) {
    out.push({ kind: "location", label: match.label, match });
  }

  return out.slice(0, 8);
}

export function smartSearchToUrlParams(
  parsed: SmartSearchResult,
): URLSearchParams {
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
  if (parsed.make) params.set("make", parsed.make);
  if (parsed.model) params.set("model", parsed.model);
  if (parsed.body_type) params.set("body_type", parsed.body_type);
  if (parsed.vehicle_condition) params.set("vehicle_condition", parsed.vehicle_condition);
  if (parsed.agent_role) params.set("role", parsed.agent_role);
  if (parsed.q && !parsed.city && !parsed.area && !parsed.state && !parsed.make) {
    params.set("q", parsed.q);
  }

  return params;
}

export function buildSearchHref(
  _pathname: string,
  parsed: SmartSearchResult,
): string {
  if (parsed.vertical === "vehicle" || parsed.make || parsed.body_type) {
    const params = smartSearchToUrlParams(parsed);
    const qs = params.toString();
    return qs ? `/vehicles?${qs}` : "/vehicles";
  }
  if (parsed.vertical === "agent" || parsed.agent_role) {
    const params = smartSearchToUrlParams(parsed);
    const qs = params.toString();
    return qs ? `/agents?${qs}` : "/agents";
  }
  const params = smartSearchToUrlParams(parsed);
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

export function budgetIndexFromPrices(min?: number, max?: number): number {
  return budgetIndexFromSearchParams(
    min != null ? String(min) : null,
    max != null ? String(max) : null,
  );
}
