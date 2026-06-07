import type { PropertySearchParams } from "@/lib/properties";
import { nigeriaLocations, NIGERIAN_STATES } from "@/constants/nigeriaLocations";
import { getLgasForState } from "@/constants/nigeriaLgas";
import { STATE_CAPITALS } from "@/constants/nigeriaAllCities";
import { toSlug } from "@/lib/location-slugs";

export type LocationMatch = {
  state: string;
  city: string;
  area: string;
  label: string;
  type: "city" | "area" | "state";
};

type LocationIndexEntry = LocationMatch & {
  terms: string[];
};

let locationIndex: LocationIndexEntry[] | null = null;

/** Common Nigerian search shortcuts — expanded before matching */
const QUERY_ALIASES: Record<string, string> = {
  ph: "port harcourt",
  portharcourt: "port harcourt",
  "port-harcourt": "port harcourt",
  vi: "victoria island",
  "v.i": "victoria island",
  lekki1: "lekki phase 1",
  lekki2: "lekki phase 2",
  "lekki p1": "lekki phase 1",
  "lekki p2": "lekki phase 2",
  "lekki phase one": "lekki phase 1",
  lek: "lekki",
  "lekki gardens": "lekki",
  "lekki shops": "lekki",
  "lekki land": "lekki",
  unilag: "yaba akoka",
  unn: "new haven enugu",
  unizik: "ifite awka",
  uniben: "ugbowo benin",
  unilorin: "tanke ilorin",
  unport: "choba port harcourt",
  futo: "nekede owerri",
  abj: "abuja",
  lag: "lagos",
  "orumba east": "orumba north",
};

export function normalizeLocationQuery(raw: string): string {
  const q = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!q) return q;
  if (QUERY_ALIASES[q]) return QUERY_ALIASES[q]!;
  for (const [alias, expanded] of Object.entries(QUERY_ALIASES)) {
    if (q === alias || q.startsWith(`${alias} `)) {
      return q.replace(alias, expanded);
    }
  }
  return q;
}

function buildLocationIndex(): LocationIndexEntry[] {
  const entries: LocationIndexEntry[] = [];

  for (const [state, { cities }] of Object.entries(nigeriaLocations)) {
    entries.push({
      state,
      city: state,
      area: state,
      label: state,
      type: "state",
      terms: [state.toLowerCase(), toSlug(state)],
    });

    for (const [city, areas] of Object.entries(cities)) {
      entries.push({
        state,
        city,
        area: city,
        label: `${city}, ${state}`,
        type: "city",
        terms: [
          city.toLowerCase(),
          toSlug(city),
          `${city} ${state}`.toLowerCase(),
        ],
      });

      for (const area of areas) {
        entries.push({
          state,
          city,
          area,
          label: `${area}, ${city}`,
          type: "area",
          terms: [
            area.toLowerCase(),
            toSlug(area),
            `${area} ${city}`.toLowerCase(),
            `${city} ${area}`.toLowerCase(),
          ],
        });
      }
    }
  }

  entries.push({
    state: "FCT",
    city: "Abuja",
    area: "Abuja",
    label: "Abuja, FCT",
    type: "city",
    terms: ["abuja", "fct", "abuja fct", "abj"],
  });

  entries.push({
    state: "Rivers",
    city: "Port Harcourt",
    area: "Port Harcourt",
    label: "Port Harcourt, Rivers",
    type: "city",
    terms: ["port harcourt", "ph", "portharcourt"],
  });

  entries.push({
    state: "Lagos",
    city: "Lagos",
    area: "Victoria Island",
    label: "Victoria Island, Lagos",
    type: "area",
    terms: ["victoria island", "vi", "v.i"],
  });

  const lagosDistricts = nigeriaLocations.Lagos?.cities ?? {};
  for (const [district, subs] of Object.entries(lagosDistricts)) {
    entries.push({
      state: "Lagos",
      city: "Lagos",
      area: district,
      label: `${district}, Lagos`,
      type: "area",
      terms: [
        district.toLowerCase(),
        `${district} lagos`.toLowerCase(),
        toSlug(district),
      ],
    });
    for (const sub of subs) {
      entries.push({
        state: "Lagos",
        city: "Lagos",
        area: sub,
        label: `${sub}, Lagos`,
        type: "area",
        terms: [
          sub.toLowerCase(),
          `${sub} lagos`.toLowerCase(),
          `${district} ${sub}`.toLowerCase(),
        ],
      });
    }
  }

  for (const state of NIGERIAN_STATES) {
    const capital = STATE_CAPITALS[state] ?? state;
    for (const lga of getLgasForState(state)) {
      const lgaLower = lga.toLowerCase();
      if (entries.some((e) => e.terms.includes(lgaLower) && e.state === state)) {
        continue;
      }
      entries.push({
        state,
        city: capital,
        area: lga,
        label: `${lga}, ${state}`,
        type: "area",
        terms: [
          lgaLower,
          toSlug(lga),
          `${lga} ${state}`.toLowerCase(),
          `${lga} ${capital}`.toLowerCase(),
        ],
      });
    }
  }

  return entries;
}

export function invalidateLocationIndex() {
  locationIndex = null;
}

function getIndex() {
  if (!locationIndex) locationIndex = buildLocationIndex();
  return locationIndex;
}

export function searchLocations(query: string, limit = 8): LocationMatch[] {
  const q = normalizeLocationQuery(query);
  if (!q) return [];

  const index = getIndex();
  const scored: { entry: LocationIndexEntry; score: number }[] = [];

  for (const entry of index) {
    let score = 0;
    for (const term of entry.terms) {
      if (term === q) score += 100;
      else if (term.startsWith(q)) score += 50;
      else if (term.includes(q)) score += 20;
    }
    if (entry.label.toLowerCase().includes(q)) score += 30;
    if (score > 0) scored.push({ entry, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ entry }) => ({
      state: entry.state,
      city: entry.city,
      area: entry.area,
      label: entry.label,
      type: entry.type,
    }));
}

const BEDROOM_RE =
  /(\d+)\s*(?:bed(?:room)?s?|br)\b|(\d+)\s*bedroom/i;
const IN_RE = /\bin\s+(.+)$/i;

/**
 * Parse natural-language location queries into search params.
 * Examples: "Lekki", "New Haven Enugu", "Gwarinpa Abuja", "2 bedroom in Yaba"
 */
export function parseLocationQuery(
  raw: string
): Partial<PropertySearchParams> & { resolvedLabel?: string } {
  const trimmed = normalizeLocationQuery(raw);
  if (!trimmed) return {};

  let bedrooms: number | undefined;
  let locationText = trimmed;

  const bedMatch = trimmed.match(BEDROOM_RE);
  if (bedMatch) {
    bedrooms = Number(bedMatch[1] ?? bedMatch[2]);
    locationText = trimmed.replace(BEDROOM_RE, "").trim();
    const inMatch = locationText.match(IN_RE);
    if (inMatch) locationText = inMatch[1].trim();
    locationText = locationText.replace(/^in\s+/i, "").trim();
  }

  const matches = searchLocations(locationText, 5);
  if (matches.length === 0) {
    return { q: trimmed, bedrooms };
  }

  const best = matches[0];
  const params: Partial<PropertySearchParams> & { resolvedLabel?: string } = {
    bedrooms,
    resolvedLabel: best.label,
  };

  if (best.type === "state") {
    params.state = best.state;
  } else if (best.type === "city") {
    params.city = best.city;
    if (best.city !== best.area) params.area = best.area;
  } else {
    params.city = best.city;
    params.area = best.area;
    params.state = best.state;
  }

  return params;
}

export function mergeQueryIntoParams(
  params: PropertySearchParams,
  q?: string
): PropertySearchParams {
  if (!q?.trim()) return params;
  const parsed = parseLocationQuery(q);
  return {
    ...params,
    state: params.state ?? parsed.state,
    city: params.city ?? parsed.city,
    area: params.area ?? parsed.area,
    bedrooms: params.bedrooms ?? parsed.bedrooms,
    q: parsed.city || parsed.area || parsed.state ? undefined : q,
  };
}
