import type { SupabaseClient } from "@supabase/supabase-js";
import { logListingEvent } from "@/lib/listing-analytics";

async function incrementFeaturedCounter(
  admin: SupabaseClient,
  listingId: string,
  column: "featured_impressions" | "featured_clicks"
): Promise<void> {
  const { data } = await admin.from("properties").select(column).eq("id", listingId).single();
  const current = Number((data as Record<string, number> | null)?.[column] ?? 0);
  await admin.from("properties").update({ [column]: current + 1 }).eq("id", listingId);
}

export async function trackFeaturedListingEvent(
  admin: SupabaseClient,
  listingId: string,
  eventType: "featured_impression" | "featured_click",
  userId?: string | null,
  sessionId?: string | null
): Promise<void> {
  await logListingEvent(admin, {
    listingId,
    eventType,
    userId,
    sessionId,
  });
  const column =
    eventType === "featured_impression" ? "featured_impressions" : "featured_clicks";
  await incrementFeaturedCounter(admin, listingId, column);
}
