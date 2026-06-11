import { createAdminClient } from "@/lib/supabase/admin";
import { EMAIL_AD_PLACEMENT_KEY } from "@/lib/email/ad-marker";
import { getPlacementByKey } from "@/lib/ads";
import type { AdPlacement } from "@/types/database";

/** Idempotent — creates email_transactional row if migration was not applied yet. */
export async function ensureEmailAdPlacement(): Promise<AdPlacement | null> {
  const existing = await getPlacementByKey(EMAIL_AD_PLACEMENT_KEY);
  if (existing) return existing;

  const admin = createAdminClient();
  if (!admin) return null;

  const { error: insertError } = await admin.from("ad_placements").insert({
    placement_key: EMAIL_AD_PLACEMENT_KEY,
    label: "Transactional email — under headline",
  });

  if (insertError && !insertError.message.includes("duplicate")) {
    return null;
  }

  return getPlacementByKey(EMAIL_AD_PLACEMENT_KEY);
}
