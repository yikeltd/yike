import type { Property, AdPlacement, Advertisement } from "@/types/database";
import type { AdPlacementKey } from "@/constants/adPlacements";
import { PropertyCard } from "./property-card";
import { FeedList } from "./feed-list";
import { AdFeedInsert } from "@/components/ads/ad-feed-insert";
import { SponsoredFeedInsert } from "@/components/ads/sponsored-feed-insert";
import { EmptyStateRich } from "./empty-state-rich";

export function PropertyGrid({
  properties,
  emptyMessage = "No homes match yet — try a nearby area or wider budget.",
  showCount,
  midFeedAd,
  sponsoredAd,
  feedAdInsertAfter = 4,
  adPlacementKey = "home_feed_mid",
  emptyCity,
  emptyArea,
  emptyListingType,
  emptyPropertyType,
  richEmpty = true,
  trackFeaturedAnalytics = false,
}: {
  properties: Property[];
  emptyMessage?: string;
  showCount?: boolean;
  isDemo?: boolean;
  trackFeaturedAnalytics?: boolean;
  midFeedAd?: AdPlacement | null;
  sponsoredAd?: Advertisement | null;
  feedAdInsertAfter?: number;
  adPlacementKey?: AdPlacementKey;
  emptyCity?: string;
  emptyArea?: string;
  emptyListingType?: string;
  emptyPropertyType?: string;
  richEmpty?: boolean;
}) {
  if (properties.length === 0) {
    if (richEmpty) {
      return (
        <EmptyStateRich
          message={emptyMessage}
          city={emptyCity}
          area={emptyArea}
          listingType={emptyListingType}
          propertyType={emptyPropertyType}
        />
      );
    }
    return (
      <div className="rounded-2xl bg-elevated px-8 py-16 text-center shadow-float">
        <p className="text-sm text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      {showCount && (
        <div className="mb-4 flex flex-wrap items-center gap-2 px-0 lg:px-0">
          <p className="text-sm text-muted">
            <span className="font-bold text-foreground">{properties.length}</span>{" "}
            homes
          </p>
        </div>
      )}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-7 xl:gap-9">
        {properties.map((p, i) => (
          <div key={p.id} className="contents">
            {sponsoredAd && i === feedAdInsertAfter ? (
              <div className="col-span-3 animate-fade-up">
                <SponsoredFeedInsert ad={sponsoredAd} />
              </div>
            ) : null}
            {!sponsoredAd && midFeedAd && i === feedAdInsertAfter ? (
              <div className="col-span-3 animate-fade-up">
                <AdFeedInsert ad={midFeedAd} placementKey={adPlacementKey} />
              </div>
            ) : null}
            <div
              className={i < 4 ? "animate-fade-up" : undefined}
              style={
                i < 4 ? { animationDelay: `${Math.min(i, 3) * 40}ms` } : undefined
              }
            >
              <PropertyCard
                property={p}
                layout="desktop"
                priorityImage={i < 3}
                trackFeaturedAnalytics={trackFeaturedAnalytics}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="lg:hidden">
        <FeedList
          properties={properties}
          midFeedAd={midFeedAd}
          sponsoredAd={sponsoredAd}
          insertAfter={feedAdInsertAfter}
          adPlacementKey={adPlacementKey}
          trackFeaturedAnalytics={trackFeaturedAnalytics}
        />
      </div>
    </div>
  );
}
