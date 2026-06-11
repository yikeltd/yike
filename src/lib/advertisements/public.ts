import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Advertisement } from "@/types/database";
import { getActiveAdvertisement } from "@/lib/advertisements/service";
import type { AdvertisementPlacement } from "@/lib/advertisements/constants";

export type { AdvertisementPlacement };

export const getSponsoredAd = cache(
  async (placement: AdvertisementPlacement): Promise<Advertisement | null> => {
    if (!isSupabaseConfigured()) return null;

    const admin = createAdminClient();
    if (admin) {
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
