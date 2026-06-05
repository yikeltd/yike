import type { Property } from "@/types/database";
import type { AdPlacement } from "@/types/database";
import type { AdPlacementKey } from "@/constants/adPlacements";
import { PropertyCard } from "./property-card";
import { FeedList } from "./feed-list";
import { AdFeedInsert } from "@/components/ads/ad-feed-insert";

export function PropertyGrid({
  properties,
  emptyMessage = "No listings found yet.",
  showCount,
  isDemo,
  midFeedAd,
  feedAdInsertAfter = 4,
  adPlacementKey = "home_feed_mid",
}: {
  properties: Property[];
  emptyMessage?: string;
  showCount?: boolean;
  isDemo?: boolean;
  midFeedAd?: AdPlacement | null;
  feedAdInsertAfter?: number;
  adPlacementKey?: AdPlacementKey;
}) {
  if (properties.length === 0) {
    return (
      <div className="rounded-2xl bg-elevated px-8 py-16 text-center shadow-float">
        <p className="text-sm text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      {(showCount || isDemo) && (
        <div className="mb-4 flex flex-wrap items-center gap-2 px-0 lg:px-0">
          {showCount && (
            <p className="text-sm text-muted">
              <span className="font-bold text-foreground">{properties.length}</span>{" "}
              homes
            </p>
          )}
          {isDemo && (
            <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-bold text-gold-dark">
              Sample listings — connect Supabase for live data
            </span>
          )}
        </div>
      )}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-7 xl:gap-9">
        {properties.map((p, i) => (
          <div key={p.id} className="contents">
            {midFeedAd && i === feedAdInsertAfter && (
              <div className="col-span-3 animate-fade-up">
                <AdFeedInsert ad={midFeedAd} placementKey={adPlacementKey} />
              </div>
            )}
            <div
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            >
              <PropertyCard
                property={p}
                layout="desktop"
                priorityImage={i < 3}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="lg:hidden">
        <FeedList
          properties={properties}
          midFeedAd={midFeedAd}
          insertAfter={feedAdInsertAfter}
          adPlacementKey={adPlacementKey}
        />
      </div>
    </div>
  );
}
