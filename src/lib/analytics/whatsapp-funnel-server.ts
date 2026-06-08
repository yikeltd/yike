import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { FunnelEventInput } from "@/lib/analytics/whatsapp-funnel";

/** Fire-and-forget internal funnel logging — never shown to users. */
export function logFunnelEvent(input: FunnelEventInput): void {
  const admin = createAdminClient();

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
