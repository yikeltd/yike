import type { Property } from "@/types/database";
import type { PropertySearchParams } from "@/lib/property-search";

function norm(value?: string): string {
  return (value ?? "").trim().toLowerCase();
}

/** Higher = better match. Featured/boost must not beat wrong-city results. */
export function propertySearchRelevance(
  property: Property,
  params: PropertySearchParams
): number {
  let score = 0;
  const city = norm(params.city);
  const area = norm(params.area);
  const propCity = norm(property.city);
  const propArea = norm(property.area);

  if (city) {
    if (propCity === city) score += 8_000;
    else if (propCity.includes(city) || city.includes(propCity)) score += 4_000;
    else score -= 6_000;
  }

  if (area) {
    if (propArea === area) score += 5_000;
    else if (propArea.includes(area) || area.includes(propArea)) score += 2_500;
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
