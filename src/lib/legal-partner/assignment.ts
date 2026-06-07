import type { SupabaseClient } from "@supabase/supabase-js";
import { isBlacklisted } from "@/lib/trust/operations/blacklist";

export type LegalAssignmentCheck =
  | { ok: true }
  | { ok: false; reason: string };

export async function canAssignLegalPartner(
  client: SupabaseClient,
  params: {
    partnerId: string;
    listingAgentId: string | null;
  }
): Promise<LegalAssignmentCheck> {
  const { data: partner } = await client
    .from("legal_partners")
    .select("id, profile_id, status, fraud_flags_count")
    .eq("id", params.partnerId)
    .single();

  if (!partner || partner.status !== "approved") {
    return { ok: false, reason: "partner_not_active" };
  }

  const blocked = await isBlacklisted(client, "legal_partner", params.partnerId);
  if (blocked.blocked) {
    return { ok: false, reason: "partner_blacklisted" };
  }

  if (params.listingAgentId && partner.profile_id === params.listingAgentId) {
    return { ok: false, reason: "partner_is_listing_agent" };
  }

  if (params.listingAgentId) {
    const { count } = await client
      .from("legal_verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("assigned_legal_partner_id", params.partnerId)
      .eq("listing_agent_id", params.listingAgentId)
      .in("status", ["completed", "reviewed", "delivered"]);

    if ((count ?? 0) >= 3) {
      return { ok: false, reason: "repeat_agent_collusion_risk" };
    }
  }

  const { count: openCount } = await client
    .from("legal_verification_requests")
    .select("id", { count: "exact", head: true })
    .eq("assigned_legal_partner_id", params.partnerId)
    .in("status", ["assigned", "in_progress"]);

  if ((openCount ?? 0) >= 4) {
    return { ok: false, reason: "partner_at_capacity" };
  }

  return { ok: true };
}
