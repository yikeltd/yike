import { toSlug } from "@/lib/location-slugs";

/** In-code aliases — DB canonical_locations extends this at runtime. */
const BUILTIN_ALIASES: Record<string, { canonical: string; state: string; city?: string; lga?: string }> = {
  lekki1: { canonical: "Lekki Phase 1", state: "Lagos", city: "Lagos" },
  "lekki phase one": { canonical: "Lekki Phase 1", state: "Lagos", city: "Lagos" },
  "lekki p1": { canonical: "Lekki Phase 1", state: "Lagos", city: "Lagos" },
  lekki2: { canonical: "Lekki Phase 2", state: "Lagos", city: "Lagos" },
  vi: { canonical: "Victoria Island", state: "Lagos", city: "Lagos" },
  "v.i": { canonical: "Victoria Island", state: "Lagos", city: "Lagos" },
  "orumba east": { canonical: "Orumba North", state: "Anambra", lga: "Orumba North" },
  ogborhill: { canonical: "Ogbor Hill", state: "Abia", city: "Aba" },
};

export type NormalizedLocation = {
  state: string;
  city: string;
  lga: string | null;
  area: string;
  neighborhood: string | null;
  canonicalArea: string;
};

function cleanPart(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function lookupAlias(part: string): { canonical: string; state?: string; city?: string; lga?: string } | null {
  const key = part.toLowerCase().trim();
  return BUILTIN_ALIASES[key] ?? null;
}

export function normalizeLocationParts(input: {
  state?: string | null;
  city?: string | null;
  lga?: string | null;
  area?: string | null;
  neighborhood?: string | null;
}): NormalizedLocation {
  const state = cleanPart(input.state) || "Lagos";
  let city = cleanPart(input.city) || cleanPart(input.area) || state;
  let area = cleanPart(input.area) || city;
  let neighborhood = cleanPart(input.neighborhood) || null;
  let lga = cleanPart(input.lga) || null;

  for (const part of [area, neighborhood, city, lga].filter(Boolean) as string[]) {
    const hit = lookupAlias(part);
    if (!hit) continue;
    area = hit.canonical;
    if (hit.city) city = hit.city;
    if (hit.lga) lga = hit.lga;
    if (hit.state) {
      /* keep provided state unless empty */
    }
    if (part === neighborhood) neighborhood = hit.canonical;
  }

  return {
    state,
    city,
    lga,
    area,
    neighborhood,
    canonicalArea: neighborhood ?? area,
  };
}

export function locationMemoryKey(loc: NormalizedLocation): string {
  return [
    toSlug(loc.state),
    toSlug(loc.city),
    toSlug(loc.lga ?? ""),
    toSlug(loc.area),
    toSlug(loc.neighborhood ?? ""),
  ].join("|");
}
