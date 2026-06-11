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

async function incrementBoostCounter(
  admin: SupabaseClient,
  listingId: string,
  column: "boost_impressions" | "boost_clicks"
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

export type PromotionAnalyticsEvent =
  | "featured_impression"
  | "featured_click"
  | "boost_impression"
  | "boost_click";

export async function trackPromotionListingEvent(
  admin: SupabaseClient,
  listingId: string,
  eventType: PromotionAnalyticsEvent,
  userId?: string | null,
  sessionId?: string | null
): Promise<void> {
  if (eventType === "featured_impression" || eventType === "featured_click") {
    await trackFeaturedListingEvent(admin, listingId, eventType, userId, sessionId);
    return;
  }

  await logListingEvent(admin, {
    listingId,
    eventType,
    userId,
    sessionId,
  });
  const column = eventType === "boost_impression" ? "boost_impressions" : "boost_clicks";
  await incrementBoostCounter(admin, listingId, column);
}
