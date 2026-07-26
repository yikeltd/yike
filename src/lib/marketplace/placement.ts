/**
 * Marketplace placement tiers — sell visibility, never trust.
 * @see docs/launch/MARKETPLACE_PLACEMENT_SYSTEM.md
 */

import type { Property } from "@/types/database";
import { isBoostedActive, isFeaturedActive } from "@/lib/agent-tiers";
import { getListingFreshness } from "@/components/property/listing-freshness";

/** Paid / algorithmic / automatic placement (max one on a card). */
export type PlacementKind = "featured" | "trending" | "new";

export type PlacementListing = Pick<
  Property,
  | "is_featured"
  | "featured_until"
  | "boosted_until"
  | "is_boosted"
  | "created_at"
  | "updated_at"
  | "last_refreshed_at"
  | "views_count"
  | "contact_clicks"
>;

const MS_DAY = 86_400_000;

/** Paid placement window (Featured or Boost). */
export function isPaidPlacementActive(listing: PlacementListing): boolean {
  return isFeaturedActive(listing as Property) || isBoostedActive(listing as Property);
}

/**
 * Interim trending signals from fields already on the listing.
 * Never invents engagement — empty metrics simply fail the bar.
 */
export function isTrendingPlacement(listing: PlacementListing): boolean {
  if (isPaidPlacementActive(listing)) return false;

  const views = listing.views_count ?? 0;
  const contacts = listing.contact_clicks ?? 0;
  const createdMs = Date.now() - new Date(listing.created_at).getTime();
  const createdDays = Math.floor(createdMs / MS_DAY);

  if (views >= 40 || contacts >= 3) return true;
  if (createdDays <= 7 && (contacts >= 2 || views >= 20)) return true;

  const freshness = getListingFreshness(listing.updated_at, {
    createdAt: listing.created_at,
    lastRefreshedAt: listing.last_refreshed_at,
    viewsCount: views,
    contactClicks: contacts,
  });
  return (
    freshness.showPublicly &&
    (freshness.tone === "trending" || freshness.tone === "hot")
  );
}

/** Automatic “Recently Added” eligibility (≤7 days). */
export function isRecentlyAddedPlacement(listing: PlacementListing): boolean {
  if (isPaidPlacementActive(listing) || isTrendingPlacement(listing)) {
    return false;
  }
  const createdMs = Date.now() - new Date(listing.created_at).getTime();
  const createdDays = Math.floor(createdMs / MS_DAY);
  if (createdDays > 7) return false;

  const freshness = getListingFreshness(listing.updated_at, {
    createdAt: listing.created_at,
    lastRefreshedAt: listing.last_refreshed_at,
  });
  return freshness.tone === "new" && freshness.showPublicly;
}

/**
 * Single placement badge — Featured > Trending > New.
 * Trust badges are resolved separately.
 */
export function resolvePlacementKind(
  listing: PlacementListing,
): PlacementKind | null {
  if (isPaidPlacementActive(listing)) return "featured";
  if (isTrendingPlacement(listing)) return "trending";
  if (isRecentlyAddedPlacement(listing)) return "new";
  return null;
}

/** Human time cue for Recently Added surfaces. */
export function placementTimeLabel(listing: PlacementListing): string | null {
  const freshness = getListingFreshness(listing.updated_at, {
    createdAt: listing.created_at,
    lastRefreshedAt: listing.last_refreshed_at,
    viewsCount: listing.views_count,
    contactClicks: listing.contact_clicks,
  });
  if (!freshness.showPublicly || !freshness.label) return null;
  if (freshness.tone === "new" || freshness.tone === "active") {
    return freshness.label;
  }
  return null;
}

export function placementBadgeLabel(kind: PlacementKind): string {
  switch (kind) {
    case "featured":
      return "Featured";
    case "trending":
      return "Trending";
    case "new":
      return "New";
  }
}

/** Soft-boost paid Featured toward the front of a discovery feed. */
export function softBoostFeaturedPlacement<T extends PlacementListing & { id: string }>(
  items: T[],
): T[] {
  if (items.length <= 1) return items;
  const featured: T[] = [];
  const rest: T[] = [];
  for (const item of items) {
    if (isPaidPlacementActive(item)) featured.push(item);
    else rest.push(item);
  }
  if (featured.length === 0) return items;
  return [...featured, ...rest];
}

/** Dedupe later rails so tiers feel exclusive, not spammy. */
export function excludeListingIds<T extends { id: string }>(
  items: T[],
  exclude: Iterable<string>,
): T[] {
  const set = exclude instanceof Set ? exclude : new Set(exclude);
  if (set.size === 0) return items;
  return items.filter((item) => !set.has(item.id));
}

export function listingIdSet(items: { id: string }[]): Set<string> {
  return new Set(items.map((i) => i.id));
}
