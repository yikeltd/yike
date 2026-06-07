import type { Property } from "@/types/database";
import type { ListingQualityFlag } from "@/lib/listing-quality";
import { analyzeListingQuality, computeListingQualityScore } from "@/lib/listing-quality";

export type ListingActivityStatus = "active" | "stale" | "inactive" | "archived";

const STALE_DAYS = 45;
const INACTIVE_DAYS = 90;

export function computeListingFreshness(property: Pick<
  Property,
  "updated_at" | "last_refreshed_at" | "created_at" | "expires_at" | "status"
>): {
  listing_activity_status: ListingActivityStatus;
  stale_score: number;
  freshness_score: number;
  stale_at: string | null;
  auto_expire_at: string | null;
  auto_archive_at: string | null;
  last_refreshed_at: string;
} {
  const refreshedAt =
    property.last_refreshed_at ?? property.updated_at ?? property.created_at;
  const daysSinceRefresh =
    (Date.now() - new Date(refreshedAt).getTime()) / 86_400_000;

  let listing_activity_status: ListingActivityStatus = "active";
  let stale_score = 0;

  if (property.status === "archived") {
    listing_activity_status = "archived";
    stale_score = 1;
  } else if (daysSinceRefresh >= INACTIVE_DAYS) {
    listing_activity_status = "inactive";
    stale_score = Math.min(1, daysSinceRefresh / INACTIVE_DAYS);
  } else if (daysSinceRefresh >= STALE_DAYS) {
    listing_activity_status = "stale";
    stale_score = Math.min(1, daysSinceRefresh / STALE_DAYS);
  } else if (daysSinceRefresh >= 14) {
    stale_score = daysSinceRefresh / STALE_DAYS * 0.5;
  }

  const auto_expire_at =
    property.expires_at ??
    new Date(Date.now() + 14 * 86_400_000).toISOString();

  const freshness_score = Math.max(
    0,
    Math.min(100, Math.round((1 - stale_score) * 100))
  );

  const stale_at =
    listing_activity_status === "stale" ||
    listing_activity_status === "inactive" ||
    listing_activity_status === "archived"
      ? new Date(
          Date.now() -
            Math.max(0, daysSinceRefresh - STALE_DAYS) * 86_400_000
        ).toISOString()
      : null;

  const auto_archive_at =
    (property as { auto_archive_at?: string | null }).auto_archive_at ??
    auto_expire_at;

  return {
    listing_activity_status,
    stale_score: Math.round(stale_score * 1000) / 1000,
    freshness_score,
    stale_at,
    auto_expire_at,
    auto_archive_at,
    last_refreshed_at: refreshedAt,
  };
}

export function listingFreshnessRankAdjustment(
  property: Pick<
    Property,
    "listing_activity_status" | "last_refreshed_at" | "updated_at" | "stale_score"
  >
): number {
  let delta = 0;
  const status = property.listing_activity_status ?? "active";
  if (status === "stale") delta -= 800;
  if (status === "inactive") delta -= 2_000;
  if (status === "archived") delta -= 5_000;

  const refreshed =
    property.last_refreshed_at ?? property.updated_at ?? new Date().toISOString();
  const days = (Date.now() - new Date(refreshed).getTime()) / 86_400_000;
  if (days <= 7) delta += 400;
  else if (days <= 14) delta += 200;

  delta -= Math.round((property.stale_score ?? 0) * 500);
  return delta;
}

export function isRecentlyUpdated(property: Pick<Property, "updated_at" | "last_refreshed_at">): boolean {
  const ref = property.last_refreshed_at ?? property.updated_at;
  const days = (Date.now() - new Date(ref).getTime()) / 86_400_000;
  return days <= 14;
}

export function computeListingHealth(property: Property): {
  listing_health_score: number;
  listing_quality_flags: ListingQualityFlag[];
} {
  const listing_quality_flags = analyzeListingQuality(property);
  const listing_health_score = computeListingQualityScore(property);
  return {
    listing_health_score,
    listing_quality_flags,
  };
}

export function listingHealthRankAdjustment(property: Pick<
  Property,
  "listing_health_score" | "possible_duplicate" | "duplicate_confidence_score" | "status"
>): number {
  let delta = 0;
  if (property.listing_health_score != null) {
    delta += property.listing_health_score * 5;
  }
  if (
    property.possible_duplicate &&
    (property.duplicate_confidence_score ?? 0) >= 0.65
  ) {
    delta -= 1_500;
  }
  if (property.status === "flagged") delta -= 3_000;
  return delta;
}
