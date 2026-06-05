import { getHotspotPlacement } from "@/lib/ads";
import { getFeaturedProperties, getPropertyById } from "@/lib/properties";
import { getMostViewedListings } from "@/lib/trending";
import type { AdPlacementKey } from "@/constants/adPlacements";
import type { Property } from "@/types/database";

export type HomeHotspotSlot = "home_hotspot_1" | "home_hotspot_2";

const SLOT_ORDER: HomeHotspotSlot[] = ["home_hotspot_1", "home_hotspot_2"];

export type HomeHotspot = {
  slot: HomeHotspotSlot;
  property: Property;
  headline: string;
  badge: string;
};

export async function getHomeHotspots(): Promise<HomeHotspot[]> {
  const [featured, trending] = await Promise.all([
    getFeaturedProperties(4),
    getMostViewedListings(4),
  ]);

  const fallbackPool = [...featured, ...trending].filter(
    (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
  );

  const results: HomeHotspot[] = [];
  const used = new Set<string>();

  for (let i = 0; i < SLOT_ORDER.length; i++) {
    const slot = SLOT_ORDER[i];
    const placement = await getHotspotPlacement(slot as AdPlacementKey);
    let property: Property | null = null;

    if (placement?.property_id) {
      property = await getPropertyById(placement.property_id);
    }

    if (!property || property.status !== "approved") {
      property =
        fallbackPool.find((p) => !used.has(p.id) && p.status === "approved") ??
        null;
    }

    if (!property) continue;
    used.add(property.id);

    results.push({
      slot,
      property,
      headline: placement?.title?.trim() || property.title,
      badge: placement?.alt_text?.trim() || (i === 0 ? "Hot pick" : "Trending now"),
    });
  }

  return results;
}
