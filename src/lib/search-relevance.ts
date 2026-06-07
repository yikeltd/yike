import type { Property } from "@/types/database";
import type { PropertySearchParams } from "@/lib/property-search";

function norm(value?: string): string {
  return (value ?? "").trim().toLowerCase();
}

function locationMatches(
  filter: string,
  value: string
): "exact" | "partial" | "none" {
  if (!filter) return "exact";
  if (value === filter) return "exact";
  if (value.includes(filter) || filter.includes(value)) return "partial";
  return "none";
}

/** Drop listings that clearly violate an active location filter. */
export function matchesLocationIntent(
  property: Property,
  params: PropertySearchParams
): boolean {
  const state = norm(params.state);
  const city = norm(params.city);
  const area = norm(params.area);
  const propState = norm(property.state);
  const propCity = norm(property.city);
  const propArea = norm(property.area);

  if (state && locationMatches(state, propState) === "none") return false;
  if (city && locationMatches(city, propCity) === "none") return false;
  if (area && locationMatches(area, propArea) === "none") return false;
  return true;
}

/** Higher = better match. Featured/boost must not beat wrong-city results. */
export function propertySearchRelevance(
  property: Property,
  params: PropertySearchParams
): number {
  let score = 0;
  const state = norm(params.state);
  const city = norm(params.city);
  const area = norm(params.area);
  const propState = norm(property.state);
  const propCity = norm(property.city);
  const propArea = norm(property.area);

  if (state) {
    const match = locationMatches(state, propState);
    if (match === "exact") score += 10_000;
    else if (match === "partial") score += 6_000;
    else score -= 50_000;
  }

  if (city) {
    const match = locationMatches(city, propCity);
    if (match === "exact") score += 8_000;
    else if (match === "partial") score += 4_000;
    else score -= 40_000;
  }

  if (area) {
    const match = locationMatches(area, propArea);
    if (match === "exact") score += 5_000;
    else if (match === "partial") score += 2_500;
    else if (area) score -= 25_000;
  }

  if (params.property_type && property.property_type === params.property_type) {
    score += 3_000;
  }

  if (params.bedrooms && property.bedrooms >= params.bedrooms) {
    score += 800;
  }

  if (params.min_price != null) {
    if (property.price >= params.min_price) score += 400;
    else score -= 1_200;
  }

  if (params.max_price != null) {
    if (property.price <= params.max_price) score += 400;
    else score -= 1_200;
  }

  if (params.q) {
    const q = norm(params.q);
    const hay = `${property.title} ${property.area} ${property.city} ${property.description ?? ""}`.toLowerCase();
    if (hay.includes(q)) score += 1_500;
  }

  return score;
}
