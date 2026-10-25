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
import { interleaveDiscoverListings } from "@/lib/discover/mixed-feed";
import { isSwipeFeedBlocked } from "@/lib/swipe/quality";
import { softBoostFeaturedPlacement } from "@/lib/marketplace/placement";

const DISCOVER_FEED_LIMIT = 80;

function rankPool(
  items: Property[],
  browsePrefs: BrowsePreferences,
  mode: "property" | "vehicle" | "electronics" | "mixed",
): Property[] {
  if (items.length === 0) return [];
  if (mode === "property") {
    return buildBalancedBrowseFeed(items, browsePrefs, DISCOVER_FEED_LIMIT);
  }
  return rankPropertiesForBrowse(items, browsePrefs).slice(0, DISCOVER_FEED_LIMIT);
}

/** Rank + filter Discover deck from property, vehicle, and electronics pools. */
export function buildDiscoverFeed(
  properties: Property[],
  vehicles: Property[],
  filters: DiscoverFilterState,
  prefs?: BrowsePreferences,
  electronics: Property[] = [],
): Property[] {
  const browsePrefs = prefs ?? getBrowsePreferences();

  const propertyPool = properties.filter((p) => !isSwipeFeedBlocked(p));
  const vehiclePool = vehicles.filter((p) => !isSwipeFeedBlocked(p));
  const electronicsPool = electronics.filter((p) => !isSwipeFeedBlocked(p));

  if (filters.category === "vehicle") {
    const filtered = applyDiscoverFilters(vehiclePool, filters);
    return softBoostFeaturedPlacement(
      rankPool(filtered, browsePrefs, "vehicle"),
    );
  }

  if (filters.category === "electronics") {
    const filtered = applyDiscoverFilters(electronicsPool, filters);
    return softBoostFeaturedPlacement(
      rankPool(filtered, browsePrefs, "electronics"),
    );
  }

  if (filters.category === "property") {
    const filtered = applyDiscoverFilters(propertyPool, filters);
    return softBoostFeaturedPlacement(
      rankPool(filtered, browsePrefs, "property"),
    );
  }

  // Mixed: filter each pool, rank, interleave for variety.
  const filteredProperties = applyDiscoverFilters(propertyPool, filters);
  const filteredVehicles = applyDiscoverFilters(vehiclePool, filters);
  const filteredElectronics = applyDiscoverFilters(electronicsPool, filters);

  const rankedProperties = rankPool(filteredProperties, browsePrefs, "property");
  const rankedVehicles = rankPool(filteredVehicles, browsePrefs, "vehicle");
  const rankedElectronics = rankPool(
    filteredElectronics,
    browsePrefs,
    "electronics",
  );

  const mixed = interleaveDiscoverListings(
    [rankedProperties, rankedVehicles, rankedElectronics],
    DISCOVER_FEED_LIMIT,
  );

  if (
    mixed.length > 0 &&
    mixed.every((p) => normalizeAssetType(p.asset_type) === "PROPERTY")
  ) {
    return softBoostFeaturedPlacement(
      buildBalancedBrowseFeed(filteredProperties, browsePrefs, DISCOVER_FEED_LIMIT),
    );
  }

  return softBoostFeaturedPlacement(mixed);
}
