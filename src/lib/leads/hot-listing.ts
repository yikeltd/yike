import type { SupabaseClient } from "@supabase/supabase-js";

/** Internal-only: flag listings with high inquiry volume (admin use). */
const HOT_LEAD_WINDOW_DAYS = 7;
const HOT_LEAD_THRESHOLD = 5;

export async function refreshHotListingFlag(
  admin: SupabaseClient,
  listingId: string
): Promise<void> {
  const since = new Date();
  since.setDate(since.getDate() - HOT_LEAD_WINDOW_DAYS);

  const { count, error } = await admin
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId)
    .gte("clicked_at", since.toISOString());

  if (error) {
    console.warn("[leads/hot-listing] count failed:", error.message);
    return;
  }

  const hot = (count ?? 0) >= HOT_LEAD_THRESHOLD;
  await admin
    .from("properties")
    .update({ hot_listing: hot })
    .eq("id", listingId);
}
