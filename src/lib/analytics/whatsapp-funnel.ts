import { createAdminClient } from "@/lib/supabase/admin";

export type FunnelEventType =
  | "whatsapp_button_clicked"
  | "whatsapp_opened"
  | "lead_created"
  | "handoff_shared"
  | "direct_whatsapp_used"
  | "direct_call_used"
  | "call_button_clicked";

export type FunnelEventInput = {
  eventType: FunnelEventType;
  listingId?: string | null;
  agentId?: string | null;
  leadId?: string | null;
  userId?: string | null;
  guestId?: string | null;
  sourcePage?: string | null;
  sourceSurface?: string | null;
  metadata?: Record<string, unknown>;
};

/** Fire-and-forget internal funnel logging — never shown to users. */
export function logFunnelEvent(input: FunnelEventInput): void {
  const admin = createAdminClient();
  if (!admin) return;

  void admin
    .from("funnel_events")
    .insert({
      event_type: input.eventType,
      listing_id: input.listingId ?? null,
      agent_id: input.agentId ?? null,
      lead_id: input.leadId ?? null,
      user_id: input.userId ?? null,
      guest_id: input.guestId ?? null,
      source_page: input.sourcePage ?? null,
      source_surface: input.sourceSurface ?? null,
      metadata: input.metadata ?? {},
    })
    .then(({ error }) => {
      if (error) console.warn("[funnel]", error.message);
    });
}
