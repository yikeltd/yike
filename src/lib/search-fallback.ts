import type { Property } from "@/types/database";
import type { PropertySearchParams } from "@/lib/property-search";
import { hasActiveFilters } from "@/lib/search-filters";
import { propertyTypeLabel } from "@/lib/utils";
import { sortPropertiesByMarketRank } from "@/lib/agent-tiers";

const COMMERCIAL_TYPES = [
  "shop",
  "office",
  "plaza",
  "warehouse",
  "event_center",
  "land_commercial",
] as const;

export type SearchFallbackStage =
  | "exact"
  | "relaxed_area"
  | "relaxed_city"
  | "state_type"
  | "related_type"
  | "none";

export type SearchResultsBundle = {
  exact: Property[];
  nearby: Property[];
  stage: SearchFallbackStage;
};

function relatedPropertyTypes(type?: string): string[] | undefined {
  if (!type) return undefined;
  if (type === "shop" || COMMERCIAL_TYPES.includes(type as (typeof COMMERCIAL_TYPES)[number])) {
    return [...COMMERCIAL_TYPES];
  }
  return [type];
}

function cloneParams(params: PropertySearchParams): PropertySearchParams {
  return { ...params };
}

function hasLocationConstraint(params: PropertySearchParams): boolean {
  return Boolean(params.state || params.city || params.area);
}

export function buildSearchEmptyCopy(params: PropertySearchParams): {
  title: string;
  message: string;
} {
  const area = params.area?.trim();
  const city = params.city?.trim();
  const state = params.state?.trim();
  const place = area || city || state || "this area";
  const typeLabel = params.property_type
    ? propertyTypeLabel(params.property_type).toLowerCase()
    : params.listing_type === "rent"
      ? "rentals"
      : params.listing_type === "sale"
        ? "properties for sale"
        : params.hub === "land_sale"
          ? "land"
          : "homes";

  const typeWord = params.property_type
    ? propertyTypeLabel(params.property_type).toLowerCase()
    : params.listing_type === "rent"
      ? "rentals"
      : params.listing_type === "sale"
        ? "properties"
        : params.hub === "land_sale"
          ? "land"
          : "listings";

  const title = area
    ? `No ${typeWord} found in ${area} yet`
    : city
      ? `No ${typeWord} found in ${city} yet`
      : state
        ? `No ${typeWord} found in ${state} yet`
        : `No ${typeWord} match your filters yet`;

  const scope = state || city || "Nigeria";
  const message = area
    ? `Try nearby areas in ${scope} or adjust your filters. We'll only show relevant ${typeLabel} in the same region.`
    : `Try a nearby area in ${scope} or clear filters to browse more ${typeLabel}.`;

  return { title, message };
}

export function buildStateBrowseHref(params: PropertySearchParams): string {
  const p = new URLSearchParams();
  if (params.state) p.set("state", params.state);
  if (params.property_type) p.set("property_type", params.property_type);
  if (params.listing_type) p.set("type", params.listing_type);
  if (params.hub) p.set("hub", params.hub);
  const qs = p.toString();
  return qs ? `/search?${qs}` : "/search";
}

export async function resolveSearchResults(
  queryFn: (params: PropertySearchParams, limit: number) => Promise<Property[]>,
  params: PropertySearchParams,
  limit = 48
): Promise<SearchResultsBundle> {
  if (!hasActiveFilters(params)) {
    const rows = await queryFn(params, limit);
    return { exact: rows, nearby: [], stage: rows.length ? "exact" : "none" };
  }

  const exact = await queryFn(params, limit);
  if (exact.length > 0) {
    return { exact, nearby: [], stage: "exact" };
  }

  if (!hasLocationConstraint(params)) {
    return { exact: [], nearby: [], stage: "none" };
  }

  const stages: { patch: Partial<PropertySearchParams>; stage: SearchFallbackStage }[] = [
    { patch: { area: undefined }, stage: "relaxed_area" },
    { patch: { area: undefined, city: undefined }, stage: "relaxed_city" },
  ];

  for (const { patch, stage } of stages) {
    const relaxed = { ...cloneParams(params), ...patch };
    const rows = await queryFn(relaxed, limit);
    const filtered = rows.filter((p) => {
      if (params.state && !p.state.toLowerCase().includes(params.state.toLowerCase())) {
        return false;
      }
      if (params.property_type && p.property_type !== params.property_type) return false;
      return true;
    });
    if (filtered.length > 0) {
      return {
        exact: [],
        nearby: sortPropertiesByMarketRank(filtered, params).slice(0, limit),
        stage,
      };
    }
  }

  const stateOnly: PropertySearchParams = {
    state: params.state,
    listing_type: params.listing_type,
    hub: params.hub,
    property_type: params.property_type,
    min_price: params.min_price,
    max_price: params.max_price,
    bedrooms: params.bedrooms,
    bathrooms: params.bathrooms,
    verified_only: params.verified_only,
    featured: params.featured,
  };

  const stateTypeRows = await queryFn(stateOnly, limit);
  if (stateTypeRows.length > 0) {
    return {
      exact: [],
      nearby: sortPropertiesByMarketRank(stateTypeRows, params).slice(0, limit),
      stage: "state_type",
    };
  }

  const related = relatedPropertyTypes(params.property_type);
  if (related && params.state) {
    const relatedParams: PropertySearchParams = {
      ...stateOnly,
      property_type: undefined,
    };
    const relatedRows = (await queryFn(relatedParams, limit * 2)).filter(
      (p) => p.property_type && related.includes(p.property_type)
    );
    if (relatedRows.length > 0) {
      return {
        exact: [],
        nearby: sortPropertiesByMarketRank(relatedRows, params).slice(0, limit),
        stage: "related_type",
      };
    }
  }

  return { exact: [], nearby: [], stage: "none" };
}
