import type { Property } from "@/types/database";
import {
  isHotelPropertyType,
  isLandPropertyType,
} from "@/constants/listingTypes";
import {
  type BrowsePreferences,
  rankPropertiesForBrowse,
} from "@/lib/browse-preferences";

type BrowseBucket =
  | "rent"
  | "sale"
  | "shortlet"
  | "land"
  | "shop"
  | "hotel"
  | "other";

const BUCKET_TARGETS: Record<BrowseBucket, number> = {
  rent: 14,
  sale: 12,
  shortlet: 12,
  land: 10,
  shop: 10,
  hotel: 10,
  other: 12,
};

function browseBucket(p: Property): BrowseBucket {
  if (isHotelPropertyType(p.property_type)) return "hotel";
  if (p.property_type === "shop") return "shop";
  if (isLandPropertyType(p.property_type)) return "land";
  if (p.listing_type === "shortlet") return "shortlet";
  if (p.listing_type === "sale") return "sale";
  return "rent";
}

/** Mix ~10 per category for swipe — local prefs applied first via rankPropertiesForBrowse. */
export function buildBalancedBrowseFeed(
  properties: Property[],
  prefs: BrowsePreferences,
  targetSize = 80
): Property[] {
  const ranked = rankPropertiesForBrowse(properties, prefs);
  const buckets: Record<BrowseBucket, Property[]> = {
    rent: [],
    sale: [],
    shortlet: [],
    land: [],
    shop: [],
    hotel: [],
    other: [],
  };

  for (const p of ranked) {
    buckets[browseBucket(p)].push(p);
  }

  const picked: Property[] = [];
  const seen = new Set<string>();

  const take = (bucket: BrowseBucket, n: number) => {
    for (const p of buckets[bucket]) {
      if (picked.length >= targetSize) break;
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      picked.push(p);
      if (--n <= 0) break;
    }
  };

  for (const [bucket, limit] of Object.entries(BUCKET_TARGETS) as [
    BrowseBucket,
    number,
  ][]) {
    take(bucket, limit);
  }

  for (const p of ranked) {
    if (picked.length >= targetSize) break;
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    picked.push(p);
  }

  return picked;
}
