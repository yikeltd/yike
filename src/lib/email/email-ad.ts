import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/constants";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import type { AdPlacement } from "@/types/database";
import { EMAIL_AD_PLACEMENT_KEY } from "./ad-marker";
import { buildEmailAdBlock } from "./components/email-ad-block";

function isLive(ad: AdPlacement): boolean {
  if (!ad.is_active || !ad.image_url?.trim()) return false;
  const now = Date.now();
  if (ad.starts_at && new Date(ad.starts_at).getTime() > now) return false;
  if (ad.ends_at && new Date(ad.ends_at).getTime() <= now) return false;
  return true;
}

/** Load active email ad from ad_placements (admin toggles at /lex/auth/ads). */
export async function resolveEmailAdHtml(
  client?: SupabaseClient | null
): Promise<string> {
  let supabase = client ?? null;
  if (!supabase) {
    if (!isAdminClientConfigured()) return "";
    supabase = createAdminClient();
  }

  const { data } = await supabase
    .from("ad_placements")
    .select("*")
    .eq("placement_key", EMAIL_AD_PLACEMENT_KEY)
    .maybeSingle();

  if (!data || !isLive(data as AdPlacement)) return "";
  return buildEmailAdBlock(data as AdPlacement);
}
