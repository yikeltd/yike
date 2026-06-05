import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getHotspotPlacement } from "@/lib/ads";
import {
  getFeaturedProperties,
  getPropertyById,
  getPublicProperties,
} from "@/lib/properties";
import { getMostViewedListings } from "@/lib/trending";
import type { Property } from "@/types/database";

export type HotPickDisplay = {
  id: string;
  property: Property;
  headline: string;
  badge: string;
};

type HotPickRow = {
  id: string;
  property_id: string;
  title: string | null;
  badge: string;
  sort_order: number;
  property: Property | null;
};

export async function getHomeHotPicks(limit = 12): Promise<HotPickDisplay[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase
        .from("home_hot_picks")
        .select(
          `id, property_id, title, badge, sort_order,
          property:properties (
            *,
            agent:profiles!properties_agent_id_fkey (
              id, full_name, phone, whatsapp, avatar_url,
              verification_status, agent_type, role
            )
          )`
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(limit);

      const rows = (data ?? []) as unknown as HotPickRow[];
      const picks = rows
        .map((row) => {
          const property = row.property;
          if (!property || property.status !== "approved") return null;
          if (new Date(property.expires_at) <= new Date()) return null;
          return {
            id: row.id,
            property,
            headline: row.title?.trim() || property.title,
            badge: row.badge?.trim() || "Hot pick",
          } satisfies HotPickDisplay;
        })
        .filter((p): p is HotPickDisplay => p !== null);

      if (picks.length > 0) return picks;
    }
  }

  return getLegacyHotPickFallback(limit);
}

async function getLegacyHotPickFallback(limit: number): Promise<HotPickDisplay[]> {
  const [featured, trending] = await Promise.all([
    getFeaturedProperties(limit),
    getMostViewedListings(limit),
  ]);

  const pool = [...featured, ...trending].filter(
    (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
  );

  const used = new Set<string>();
  const results: HotPickDisplay[] = [];

  for (const slot of ["home_hotspot_1", "home_hotspot_2"] as const) {
    const placement = await getHotspotPlacement(slot);
    let property: Property | null = null;

    if (placement?.property_id) {
      property = await getPropertyById(placement.property_id);
    }

    if (!property || property.status !== "approved") {
      property = pool.find((p) => !used.has(p.id)) ?? null;
    }

    if (!property) continue;
    used.add(property.id);
    results.push({
      id: slot,
      property,
      headline: placement?.title?.trim() || property.title,
      badge: placement?.alt_text?.trim() || "Hot pick",
    });
  }

  if (results.length >= limit) return results.slice(0, limit);

  for (const p of pool) {
    if (used.has(p.id)) continue;
    used.add(p.id);
    results.push({
      id: p.id,
      property: p,
      headline: p.title,
      badge: "Trending",
    });
    if (results.length >= limit) break;
  }

  return results;
}

/** Approved listings for admin picker. */
export async function getHotPickCandidates(limit = 20) {
  return getPublicProperties({}, limit);
}
