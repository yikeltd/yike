import { isListingPubliclyActive } from "@/lib/listing-lifecycle";
import type { Property, PropertyStatus } from "@/types/database";

/** Mirrors `queryPublic*` Supabase filters (approved + unexpired). */
export function passesPublicListingQueryFilters(
  row: Pick<Property, "status" | "expires_at">,
  now: Date = new Date(),
): boolean {
  if (row.status !== "approved") return false;
  return new Date(row.expires_at) > now;
}

/** Approved, unexpired, and availability allows public surfacing. */
export function isDiscoverFeedCandidate(
  row: Pick<
    Property,
    "status" | "expires_at" | "availability_status" | "asset_type"
  >,
  now: Date = new Date(),
): boolean {
  if (!passesPublicListingQueryFilters(row, now)) return false;
  return isListingPubliclyActive(row);
}

export const NEW_LISTING_MODERATION_STATUS: PropertyStatus = "pending";
