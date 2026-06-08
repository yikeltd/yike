import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchListingsByIds,
  searchAdminListings,
  suggestHotPickListings,
} from "./listings";
import { fetchPartnersByIds, searchAdminPartners } from "./partners";
import { fetchProfilesByIds, searchAdminProfiles } from "./profiles";
import type {
  AdminEntitySearchResult,
  AdminEntityType,
  ListingSearchFilters,
  ProfileSearchFilters,
} from "./types";

export type { AdminEntitySearchResult, AdminEntityType } from "./types";
export { suggestHotPickListings };

const PARTNER_TYPES = new Set<AdminEntityType>([
  "verifier",
  "ambassador",
  "legal_partner",
]);

const PROFILE_TYPES = new Set<AdminEntityType>([
  "user",
  "agent",
  "company",
  "staff",
]);

export async function searchAdminEntities(
  admin: SupabaseClient,
  type: AdminEntityType,
  query: string,
  options: {
    limit?: number;
    excludeIds?: string[];
    listingFilters?: ListingSearchFilters;
    profileFilters?: ProfileSearchFilters;
  } = {}
): Promise<AdminEntitySearchResult[]> {
  const limit = options.limit ?? 15;

  if (type === "listing") {
    return searchAdminListings(
      admin,
      query,
      options.listingFilters,
      limit,
      options.excludeIds
    );
  }
  if (PROFILE_TYPES.has(type)) {
    return searchAdminProfiles(admin, type, query, options.profileFilters, limit);
  }
  if (PARTNER_TYPES.has(type)) {
    return searchAdminPartners(admin, type, query, limit);
  }
  return [];
}

export async function fetchAdminEntitiesByIds(
  admin: SupabaseClient,
  type: AdminEntityType,
  ids: string[]
): Promise<AdminEntitySearchResult[]> {
  if (type === "listing") return fetchListingsByIds(admin, ids);
  if (PROFILE_TYPES.has(type)) return fetchProfilesByIds(admin, type, ids);
  if (PARTNER_TYPES.has(type)) return fetchPartnersByIds(admin, type, ids);
  return [];
}
