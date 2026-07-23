import type { Property, AdPlacement, Advertisement } from "@/types/database";
import type { AdPlacementKey } from "@/constants/adPlacements";
import { PropertyCard, type PropertyCardVariant } from "./property-card";
import { AdFeedInsert } from "@/components/ads/ad-feed-insert";
import { SponsoredFeedInsert } from "@/components/ads/sponsored-feed-insert";
import { EmptyStateRich } from "./empty-state-rich";
import { BROWSE_GRID_CLASS } from "@/lib/marketplace/browse-grid";

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
  cardVariant = "default",
  priorityCount,
  gridClassName,
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
  /** Homepage inventory rails — image-dominant browse cards. */
  cardVariant?: PropertyCardVariant;
  /** How many above-the-fold images get priority (default: browse=2, else=6). */
  priorityCount?: number;
  /** Override browse density (e.g. homepage desktop premium rails). */
  gridClassName?: string;
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

  const eager =
    priorityCount ?? (cardVariant === "browse" ? 2 : 6);

  return (
    <div>
      {showCount && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted">
            <span className="font-bold text-foreground">{properties.length}</span>{" "}
            homes
          </p>
        </div>
      )}
      <div className={gridClassName ?? BROWSE_GRID_CLASS}>
        {properties.map((p, i) => (
          <div key={p.id} className="contents">
            {sponsoredAd && i === feedAdInsertAfter ? (
              <div className="col-span-full animate-fade-up">
                <SponsoredFeedInsert ad={sponsoredAd} />
              </div>
            ) : null}
            {!sponsoredAd && midFeedAd && i === feedAdInsertAfter ? (
              <div className="col-span-full animate-fade-up">
                <AdFeedInsert ad={midFeedAd} placementKey={adPlacementKey} />
              </div>
            ) : null}
            <div
              className={i < 8 ? "animate-fade-up" : undefined}
              style={
                i < 8
                  ? { animationDelay: `${Math.min(i, 7) * 30}ms` }
                  : undefined
              }
            >
              <PropertyCard
                property={p}
                layout="desktop"
                priorityImage={i < eager}
                trackFeaturedAnalytics={trackFeaturedAnalytics}
                variant={cardVariant}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
