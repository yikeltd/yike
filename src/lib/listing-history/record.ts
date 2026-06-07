import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListingHistoryEventType } from "./constants";

export type RecordListingHistoryInput = {
  listingId: string;
  eventType: ListingHistoryEventType;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  actorId?: string | null;
  actorRole?: string | null;
  source?: string;
  publicVisible?: boolean;
  internalNote?: string | null;
};

/** Append a listing history event (uses DB helper + summary refresh). */
export async function recordListingHistoryEvent(
  admin: SupabaseClient,
  input: RecordListingHistoryInput
): Promise<string | null> {
  const { data, error } = await admin.rpc("yike_insert_listing_history_event", {
    p_listing_id: input.listingId,
    p_event_type: input.eventType,
    p_old_value: input.oldValue ?? null,
    p_new_value: input.newValue ?? null,
    p_actor_id: input.actorId ?? null,
    p_actor_role: input.actorRole ?? null,
    p_source: input.source ?? "api",
    p_public_visible: input.publicVisible ?? false,
    p_internal_note: input.internalNote ?? null,
  });

  if (error) {
    console.warn("[listing-history] record failed", input.eventType, error.message);
    return null;
  }
  return typeof data === "string" ? data : null;
}

export type ListingHistoryRow = {
  id: string;
  listing_id: string;
  event_type: ListingHistoryEventType;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  actor_id: string | null;
  actor_role: string | null;
  source: string | null;
  public_visible: boolean;
  internal_note: string | null;
  created_at: string;
};

export async function getListingHistoryTimeline(
  admin: SupabaseClient,
  listingId: string,
  options?: {
    limit?: number;
    eventType?: string;
    publicOnly?: boolean;
  }
): Promise<ListingHistoryRow[]> {
  let query = admin
    .from("listing_history_events")
    .select("*")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 100);

  if (options?.eventType) {
    query = query.eq("event_type", options.eventType);
  }
  if (options?.publicOnly) {
    query = query.eq("public_visible", true);
  }

  const { data } = await query;
  return (data ?? []) as ListingHistoryRow[];
}
