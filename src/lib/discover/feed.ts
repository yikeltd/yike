import type { Property } from "@/types/database";
import { buildBalancedBrowseFeed } from "@/lib/browse-feed";
import {
  getBrowsePreferences,
  rankPropertiesForBrowse,
  type BrowsePreferences,
} from "@/lib/browse-preferences";
import { normalizeAssetType } from "@/lib/marketplace/listings";
import {
  applyDiscoverFilters,
  type DiscoverFilterState,
} from "@/lib/discover/filters";
import { isSwipeFeedBlocked } from "@/lib/swipe/quality";

/** Rank + filter Discover deck from property and vehicle pools. */
export function buildDiscoverFeed(
  properties: Property[],
  vehicles: Property[],
  filters: DiscoverFilterState,
  prefs?: BrowsePreferences,
): Property[] {
  const browsePrefs = prefs ?? getBrowsePreferences();
  const pool =
    filters.category === "vehicle"
      ? vehicles
      : filters.category === "property"
        ? properties
        : [...properties, ...vehicles];

  const filtered = applyDiscoverFilters(
    pool.filter((p) => !isSwipeFeedBlocked(p)),
    filters,
  );

  if (filters.category === "vehicle") {
    return rankPropertiesForBrowse(filtered, browsePrefs).slice(0, 80);
  }

  if (
    filtered.every((p) => normalizeAssetType(p.asset_type) !== "VEHICLE")
  ) {
    return buildBalancedBrowseFeed(filtered, browsePrefs, 80);
  }

  return rankPropertiesForBrowse(filtered, browsePrefs).slice(0, 80);
}
