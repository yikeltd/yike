import type { SupabaseClient } from "@supabase/supabase-js";
import type { DealMatchStatus } from "@/lib/deal-matching/constants";

export async function updateDealStatus(
  admin: SupabaseClient,
  requestId: string,
  toStatus: DealMatchStatus,
  actorId: string,
  notes?: string
): Promise<void> {
  const { data: current } = await admin
    .from("deal_match_requests")
    .select("status")
    .eq("id", requestId)
    .single();

  const fromStatus = (current?.status as string | undefined) ?? null;
  const now = new Date().toISOString();

  await admin
    .from("deal_match_requests")
    .update({ status: toStatus, updated_at: now })
    .eq("id", requestId);

  await admin.from("deal_match_status_events").insert({
    request_id: requestId,
    from_status: fromStatus,
    to_status: toStatus,
    actor_id: actorId,
    notes: notes?.trim() || null,
  });
}
