"use client";

import type { Property } from "@/types/database";
import type { AdPlacement } from "@/types/database";
import type { AdPlacementKey } from "@/constants/adPlacements";
import { PropertyCard } from "./property-card";
import { AdFeedInsert } from "@/components/ads/ad-feed-insert";

export function FeedList({
  properties,
  midFeedAd,
  insertAfter = 4,
  adPlacementKey = "home_feed_mid",
}: {
  properties: Property[];
  midFeedAd?: AdPlacement | null;
  insertAfter?: number;
  adPlacementKey?: AdPlacementKey;
}) {
  return (
    <div className="feed-rhythm flex flex-col pb-2">
      {properties.map((p, i) => (
        <div
          key={p.id}
          className="feed-item"
          style={
            i > 2
              ? { contentVisibility: "auto", containIntrinsicSize: "520px" }
              : undefined
          }
        >
          {midFeedAd && i === insertAfter && (
            <div className="mb-5 animate-fade-up">
              <AdFeedInsert ad={midFeedAd} placementKey={adPlacementKey} />
            </div>
          )}
          <div
            className={i < 4 ? "animate-fade-up" : undefined}
            style={
              i < 4 ? { animationDelay: `${Math.min(i, 3) * 40}ms` } : undefined
            }
          >
            <PropertyCard
              property={p}
              layout="mobile"
              priorityImage={i < 3}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
