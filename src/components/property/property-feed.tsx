import type { Property, AdPlacement, Advertisement } from "@/types/database";
import type { AdPlacementKey } from "@/constants/adPlacements";
import { PropertyGrid } from "./property-grid";
import { EmptyStateRich } from "./empty-state-rich";

export function PropertyFeed({
  properties,
  emptyMessage = "Beautiful homes are coming soon.",
  emptyTitle,
  showCount,
  isDemo,
  midFeedAd,
  sponsoredAd,
  feedAdInsertAfter = 5,
  adPlacementKey = "search_feed_mid",
  emptyCity,
  emptyArea,
  emptyListingType,
  emptyPropertyType,
  stateBrowseHref,
  clearFiltersHref,
}: {
  properties: Property[];
  emptyMessage?: string;
  emptyTitle?: string;
  showCount?: boolean;
  isDemo?: boolean;
  midFeedAd?: AdPlacement | null;
  sponsoredAd?: Advertisement | null;
  feedAdInsertAfter?: number;
  adPlacementKey?: AdPlacementKey;
  emptyCity?: string;
  emptyArea?: string;
  emptyListingType?: string;
  emptyPropertyType?: string;
  stateBrowseHref?: string;
  clearFiltersHref?: string;
}) {
  if (properties.length === 0) {
    return (
      <EmptyStateRich
        title={emptyTitle}
        message={emptyMessage}
        city={emptyCity}
        area={emptyArea}
        listingType={emptyListingType}
        propertyType={emptyPropertyType}
        stateBrowseHref={stateBrowseHref}
        clearFiltersHref={clearFiltersHref}
        layout="full"
      />
    );
  }

  return (
    <PropertyGrid
      properties={properties}
      showCount={showCount}
      isDemo={isDemo}
      midFeedAd={midFeedAd}
      sponsoredAd={sponsoredAd}
      feedAdInsertAfter={feedAdInsertAfter}
      adPlacementKey={adPlacementKey}
      emptyCity={emptyCity}
      emptyArea={emptyArea}
      emptyListingType={emptyListingType}
      emptyPropertyType={emptyPropertyType}
      richEmpty={false}
    />
  );
}
