import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { SiteBanner } from "@/types/database";
import {
  DEFAULT_VERIFICATION_BANNER,
  MOBILE_HEADER_PLACEMENT,
  type SiteBannerPlacement,
} from "@/constants/siteBanners";

export { MOBILE_HEADER_PLACEMENT } from "@/constants/siteBanners";
export type { SiteBannerPlacement } from "@/constants/siteBanners";

function isLive(banner: SiteBanner): boolean {
  if (!banner.is_active) return false;
  const hasContent =
    banner.message?.trim() ||
    banner.title?.trim() ||
    banner.subtitle?.trim() ||
    banner.image_url?.trim();
  if (!hasContent) return false;

  const now = Date.now();
  if (banner.starts_at && new Date(banner.starts_at).getTime() > now) return false;
  if (banner.ends_at && new Date(banner.ends_at).getTime() <= now) return false;
  return true;
}

async function fetchBannersForPlacement(placement: string): Promise<SiteBanner[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("site_banners")
    .select("*")
    .eq("placement", placement)
    .eq("is_active", true)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10);

  return (data ?? []) as SiteBanner[];
}

export const getActiveBannerForPlacement = cache(
  async (placement: SiteBannerPlacement): Promise<SiteBanner | null> => {
    const rows = await fetchBannersForPlacement(placement);
    return rows.find(isLive) ?? null;
  }
);

function verificationMobileHeaderFallback(): SiteBanner {
  const now = new Date().toISOString();
  return {
    id: "default-verification-mobile-header",
    placement: MOBILE_HEADER_PLACEMENT,
    title: DEFAULT_VERIFICATION_BANNER.title,
    subtitle: DEFAULT_VERIFICATION_BANNER.subtitle,
    message: DEFAULT_VERIFICATION_BANNER.subtitle,
    cta_text: DEFAULT_VERIFICATION_BANNER.ctaText,
    link_url: DEFAULT_VERIFICATION_BANNER.linkUrl,
    image_url: null,
    is_active: true,
    priority: 0,
    starts_at: null,
    ends_at: null,
    created_at: now,
    updated_at: now,
  };
}

export const getActiveMobileHeaderBanner = cache(async (): Promise<SiteBanner | null> => {
  const banner = await getActiveBannerForPlacement(MOBILE_HEADER_PLACEMENT);
  return banner ?? verificationMobileHeaderFallback();
});

export async function getAllSiteBanners(
  placement?: SiteBannerPlacement
): Promise<SiteBanner[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  if (!supabase) return [];

  let query = supabase
    .from("site_banners")
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (placement) query = query.eq("placement", placement);

  const { data } = await query;
  return (data ?? []) as SiteBanner[];
}
