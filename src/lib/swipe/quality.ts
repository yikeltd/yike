import type { Property } from "@/types/database";
import { normalizePropertyMedia } from "@/lib/media/items";
import { POOR_COVER_LABELS } from "@/lib/media/labels";
import {
  mediaItemQualityPenalty,
  mediaUrlQualityPenalty,
} from "@/lib/swipe/image-heuristics";

/** Lightweight quality heuristics — deprioritize poor uploads in swipe feed. */
export function swipeQualityPenalty(property: Property): number {
  let penalty = 0;
  const items = normalizePropertyMedia(property);
  const urls = property.media_urls ?? [];

  if (items.length < 3) penalty += 15;
  if (urls.length !== new Set(urls).size) penalty += 20;

  for (const item of items) {
    penalty += mediaItemQualityPenalty(item) * 0.35;
  }
  for (const url of urls) {
    penalty += mediaUrlQualityPenalty(url) * 0.2;
  }

  const cover = items.find((i) => i.is_cover) ?? items[0];
  if (cover?.room_label && POOR_COVER_LABELS.has(String(cover.room_label))) {
    penalty += 12;
  }

  return Math.round(penalty);
}

export function swipeQualityBoost(property: Property): number {
  const items = normalizePropertyMedia(property);
  const labeled = items.filter((i) => i.room_label && i.room_label !== "Other");
  const uniqueLabels = new Set(labeled.map((i) => i.room_label)).size;
  return Math.min(labeled.length * 2 + uniqueLabels * 2, 20);
}

/** Skip listings with extreme quality issues from swipe feed entirely. */
export function isSwipeFeedBlocked(property: Property): boolean {
  return swipeQualityPenalty(property) >= 55;
}
