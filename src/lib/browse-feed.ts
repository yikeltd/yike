import type { Property } from "@/types/database";
import {
  isHotelPropertyType,
  isLandPropertyType,
} from "@/constants/listingTypes";
import {
  type BrowsePreferences,
  rankPropertiesForBrowse,
} from "@/lib/browse-preferences";
import { isSwipeFeedBlocked } from "@/lib/swipe/quality";

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

/** Mix property types within a bucket — avoid 10 self-contains in a row. */
function diversifyByPropertyType(list: Property[]): Property[] {
  if (list.length <= 2) return list;

  const groups = new Map<string, Property[]>();
  for (const p of list) {
    const key = p.property_type ?? "other";
    const g = groups.get(key) ?? [];
    g.push(p);
    groups.set(key, g);
  }

  const keys = [...groups.keys()];
  const picked: Property[] = [];
  let round = 0;

  while (picked.length < list.length && round < list.length * 2) {
    let added = false;
    for (const key of keys) {
      const g = groups.get(key);
      const item = g?.[round];
      if (!item) continue;
      picked.push(item);
      added = true;
    }
    round++;
    if (!added) break;
  }

  return picked.length > 0 ? picked : list;
}

function interleaveBuckets(
  buckets: Record<BrowseBucket, Property[]>,
  targetSize: number
): Property[] {
  const picked: Property[] = [];
  const seen = new Set<string>();
  const keys = Object.keys(BUCKET_TARGETS) as BrowseBucket[];
  const counts: Record<BrowseBucket, number> = {
    rent: 0,
    sale: 0,
    shortlet: 0,
    land: 0,
    shop: 0,
    hotel: 0,
    other: 0,
  };
  let round = 0;

  while (picked.length < targetSize && round < targetSize * 3) {
    let added = false;
    for (const bucket of keys) {
      if (picked.length >= targetSize) break;
      if (counts[bucket] >= BUCKET_TARGETS[bucket]) continue;
      const list = buckets[bucket];
      const item = list[counts[bucket]];
      if (!item || seen.has(item.id)) {
        counts[bucket]++;
        continue;
      }
      seen.add(item.id);
      picked.push(item);
      counts[bucket]++;
      added = true;
    }
    round++;
    if (!added) break;
  }

  return picked;
}

/** Mix categories for swipe — location prefs first, then diverse types. */
export function buildBalancedBrowseFeed(
  properties: Property[],
  prefs: BrowsePreferences,
  targetSize = 80
): Property[] {
  const eligible = properties.filter((p) => !isSwipeFeedBlocked(p));
  const pool = eligible.length >= 8 ? eligible : properties;
  const ranked = rankPropertiesForBrowse(pool, prefs);

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

  for (const key of Object.keys(buckets) as BrowseBucket[]) {
    buckets[key] = diversifyByPropertyType(buckets[key]);
  }

  const picked = interleaveBuckets(buckets, targetSize);
  const seen = new Set(picked.map((p) => p.id));

  for (const p of ranked) {
    if (picked.length >= targetSize) break;
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    picked.push(p);
  }

  return picked;
}
