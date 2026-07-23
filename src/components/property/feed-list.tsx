"use client";

import type { Property, AdPlacement, Advertisement } from "@/types/database";
import type { AdPlacementKey } from "@/constants/adPlacements";
import { PropertyCard } from "./property-card";
import { AdFeedInsert } from "@/components/ads/ad-feed-insert";
import { SponsoredFeedInsert } from "@/components/ads/sponsored-feed-insert";
import { BROWSE_GRID_CLASS } from "@/lib/marketplace/browse-grid";

/** Dense browse grid (same density as PropertyGrid) — used when a client wrapper is needed. */
export function FeedList({
  properties,
  midFeedAd,
  sponsoredAd,
  insertAfter = 4,
  adPlacementKey = "home_feed_mid",
  trackFeaturedAnalytics = false,
}: {
  properties: Property[];
  midFeedAd?: AdPlacement | null;
  sponsoredAd?: Advertisement | null;
  insertAfter?: number;
  adPlacementKey?: AdPlacementKey;
  trackFeaturedAnalytics?: boolean;
}) {
  return (
    <div className={BROWSE_GRID_CLASS}>
      {properties.map((p, i) => (
        <div key={p.id} className="contents">
          {sponsoredAd && i === insertAfter ? (
            <div className="col-span-full animate-fade-up">
              <SponsoredFeedInsert ad={sponsoredAd} />
            </div>
          ) : null}
          {!sponsoredAd && midFeedAd && i === insertAfter ? (
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
              layout="mobile"
              priorityImage={i < 4}
              trackFeaturedAnalytics={trackFeaturedAnalytics}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
