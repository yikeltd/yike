import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { AdPlacement } from "@/types/database";
import type { AdPlacementKey } from "@/constants/adPlacements";

function isLive(ad: AdPlacement): boolean {
  if (!ad.is_active || !ad.image_url?.trim()) return false;
  const now = Date.now();
  if (ad.starts_at && new Date(ad.starts_at).getTime() > now) return false;
  if (ad.ends_at && new Date(ad.ends_at).getTime() <= now) return false;
  return true;
}

export async function getActiveAd(
  placementKey: AdPlacementKey
): Promise<AdPlacement | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("ad_placements")
    .select("*")
    .eq("placement_key", placementKey)
    .maybeSingle();

  if (!data) return null;
  const ad = data as AdPlacement;
  return isLive(ad) ? ad : null;
}

export async function getAllAdPlacements(): Promise<AdPlacement[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("ad_placements")
    .select("*")
    .order("label");

  return (data ?? []) as AdPlacement[];
}

export async function getPlacementByKey(
  placementKey: string
): Promise<AdPlacement | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("ad_placements")
    .select("*")
    .eq("placement_key", placementKey)
    .maybeSingle();

  return (data as AdPlacement) ?? null;
}

/** @deprecated use getPlacementByKey */
export async function getAdPlacementByKey(
  placementKey: string
): Promise<AdPlacement | null> {
  return getPlacementByKey(placementKey);
}

export async function getHotspotPlacement(
  placementKey: AdPlacementKey
): Promise<AdPlacement | null> {
  const placement = await getPlacementByKey(placementKey);
  if (!placement?.is_active) return null;
  const now = Date.now();
  if (placement.starts_at && new Date(placement.starts_at).getTime() > now)
    return null;
  if (placement.ends_at && new Date(placement.ends_at).getTime() <= now)
    return null;
  if (placement.property_id || placement.title?.trim()) return placement;
  return null;
}
