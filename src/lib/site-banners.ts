import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { SiteBanner } from "@/types/database";
import { MOBILE_HEADER_PLACEMENT } from "@/constants/siteBanners";

export { MOBILE_HEADER_PLACEMENT } from "@/constants/siteBanners";

function isLive(banner: SiteBanner): boolean {
  if (!banner.is_active) return false;
  const hasContent =
    banner.message?.trim() ||
    banner.title?.trim() ||
    banner.image_url?.trim();
  if (!hasContent) return false;

  const now = Date.now();
  if (banner.starts_at && new Date(banner.starts_at).getTime() > now) return false;
  if (banner.ends_at && new Date(banner.ends_at).getTime() <= now) return false;
  return true;
}

export const getActiveMobileHeaderBanner = cache(async (): Promise<SiteBanner | null> => {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("site_banners")
    .select("*")
    .eq("placement", MOBILE_HEADER_PLACEMENT)
    .eq("is_active", true)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10);

  const rows = (data ?? []) as SiteBanner[];
  return rows.find(isLive) ?? null;
});

export async function getAllSiteBanners(
  placement = MOBILE_HEADER_PLACEMENT
): Promise<SiteBanner[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("site_banners")
    .select("*")
    .eq("placement", placement)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  return (data ?? []) as SiteBanner[];
}
