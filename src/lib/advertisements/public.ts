import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  createAdminClient,
  isAdminClientConfigured,
} from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Advertisement } from "@/types/database";
import { getActiveAdvertisement } from "@/lib/advertisements/service";
import {
  HOMEPAGE_AD_SLOTS,
  type AdvertisementPlacement,
  type HomepageAdSlot,
} from "@/lib/advertisements/constants";

export type { AdvertisementPlacement, HomepageAdSlot };

export const getSponsoredAd = cache(
  async (placement: AdvertisementPlacement): Promise<Advertisement | null> => {
    if (!isSupabaseConfigured()) return null;

    if (isAdminClientConfigured()) {
      const admin = createAdminClient();
      return getActiveAdvertisement(admin, placement);
    }

    const supabase = await createClient();
    if (!supabase) return null;

    const now = new Date().toISOString();
    const { data } = await supabase
      .from("advertisements")
      .select("*")
      .eq("placement", placement)
      .eq("status", "active")
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .limit(1)
      .maybeSingle();

    return (data as Advertisement | null) ?? null;
  }
);

/** Active homepage slots 1–5 — missing slots are null (layout collapses). */
export const getHomepageAds = cache(
  async (): Promise<Record<HomepageAdSlot, Advertisement | null>> => {
    const entries = await Promise.all(
      HOMEPAGE_AD_SLOTS.map(async (slot) => {
        const ad = await getSponsoredAd(slot);
        return [slot, ad] as const;
      }),
    );
    return Object.fromEntries(entries) as Record<
      HomepageAdSlot,
      Advertisement | null
    >;
  },
);
