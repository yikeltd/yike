import type { Property } from "@/types/database";
import type { AdPlacement } from "@/types/database";
import type { AdPlacementKey } from "@/constants/adPlacements";
import { PropertyGrid } from "./property-grid";
import { EmptyStateRich } from "./empty-state-rich";

export function PropertyFeed({
  properties,
  emptyMessage = "Beautiful homes are coming soon.",
  showCount,
  isDemo,
  midFeedAd,
  feedAdInsertAfter = 5,
  adPlacementKey = "search_feed_mid",
  emptyCity,
  emptyArea,
}: {
  properties: Property[];
  emptyMessage?: string;
  showCount?: boolean;
  isDemo?: boolean;
  midFeedAd?: AdPlacement | null;
  feedAdInsertAfter?: number;
  adPlacementKey?: AdPlacementKey;
  emptyCity?: string;
  emptyArea?: string;
}) {
  if (properties.length === 0) {
    return (
      <EmptyStateRich
        message={emptyMessage}
        city={emptyCity}
        area={emptyArea}
      />
    );
  }

  return (
    <PropertyGrid
      properties={properties}
      showCount={showCount}
      isDemo={isDemo}
      midFeedAd={midFeedAd}
      feedAdInsertAfter={feedAdInsertAfter}
      adPlacementKey={adPlacementKey}
    />
  );
}
