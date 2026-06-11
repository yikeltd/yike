import type { SupabaseClient } from "@supabase/supabase-js";

export const LISTING_EVENT_TYPES = [
  "view",
  "save",
  "unsave",
  "whatsapp_click",
  "call_click",
  "share",
  "search_impression",
  "featured_impression",
  "featured_click",
  "boost_impression",
  "boost_click",
  "boost_order",
] as const;

export type ListingEventType = (typeof LISTING_EVENT_TYPES)[number];

export type LogListingEventInput = {
  listingId: string;
  eventType: ListingEventType;
  userId?: string | null;
  sessionId?: string | null;
  city?: string | null;
  state?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logListingEvent(
  admin: SupabaseClient,
  input: LogListingEventInput
): Promise<void> {
  if (!LISTING_EVENT_TYPES.includes(input.eventType)) return;

  await admin.from("listing_analytics_events").insert({
    listing_id: input.listingId,
    event_type: input.eventType,
    user_id: input.userId ?? null,
    session_id: input.sessionId ?? null,
    city: input.city ?? null,
    state: input.state ?? null,
    metadata: input.metadata ?? {},
  });
}
