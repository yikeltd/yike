import type { Property } from "@/types/database";
import { buildMotionSlides } from "@/lib/media/items";
import { prefetchListingImages } from "@/lib/image-prefetch";
import {
  getSwipeImageWidth,
  getSwipePreloadCount,
  isLowDataMode,
} from "@/lib/swipe/low-data";
import { cacheSlideLabels } from "@/lib/swipe/memory";

/** Preload next cards: first image + labels + light 2nd frame only. */
export function preloadUpcomingSwipeCards(
  feed: Property[],
  currentIndex: number
) {
  if (typeof window === "undefined") return;
  const n = feed.length;
  if (n === 0) return;

  const width = getSwipeImageWidth();
  const limit = getSwipePreloadCount();
  const lowData = isLowDataMode();

  for (let i = 1; i <= limit; i++) {
    const next = feed[(currentIndex + i) % n];
    if (!next) continue;

    const frames = buildMotionSlides(next);
    cacheSlideLabels(
      next.id,
      frames.map((f) => f.label)
    );

    const first = frames[0]?.url;
    if (first) prefetchListingImages([first], width);

    if (!lowData && frames[1]?.url) {
      prefetchListingImages([frames[1].url], Math.round(width * 0.9));
    }
  }
}

/** Preload next frame within the current card (light). */
export function preloadNextMotionFrame(
  property: Property,
  frameIndex: number
) {
  if (typeof window === "undefined") return;
  const frames = buildMotionSlides(property);
  const next = frames[(frameIndex + 1) % frames.length]?.url;
  if (next) prefetchListingImages([next], getSwipeImageWidth());
}
