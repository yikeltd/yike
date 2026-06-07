import type { SupabaseClient } from "@supabase/supabase-js";
import { isBlacklisted } from "@/lib/trust/operations/blacklist";

export type AssignmentCheckResult =
  | { ok: true }
  | { ok: false; reason: string };

/** Prevent verifier collusion with listing agent or repeat abuse. */
export async function canAssignVerifier(
  client: SupabaseClient,
  params: {
    verifierId: string;
    propertyId: string;
    listingAgentId: string | null;
  }
): Promise<AssignmentCheckResult> {
  const { data: verifier } = await client
    .from("field_verifiers")
    .select("id, profile_id, status, fraud_flags_count")
    .eq("id", params.verifierId)
    .single();

  if (!verifier || verifier.status !== "approved") {
    return { ok: false, reason: "verifier_not_active" };
  }

  const blocked = await isBlacklisted(client, "verifier", params.verifierId);
  if (blocked.blocked) {
    return { ok: false, reason: "verifier_blacklisted" };
  }

  if (params.listingAgentId && verifier.profile_id === params.listingAgentId) {
    return { ok: false, reason: "verifier_is_listing_agent" };
  }

  if (params.listingAgentId) {
    const { count } = await client
      .from("property_verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("assigned_verifier_id", params.verifierId)
      .eq("listing_agent_id", params.listingAgentId)
      .in("status", ["completed", "reviewed"]);

    if ((count ?? 0) >= 3) {
      return { ok: false, reason: "repeat_agent_collusion_risk" };
    }
  }

  const { count: openCount } = await client
    .from("property_verification_requests")
    .select("id", { count: "exact", head: true })
    .eq("assigned_verifier_id", params.verifierId)
    .in("status", ["assigned", "accepted", "in_progress"]);

  if ((openCount ?? 0) >= 5) {
    return { ok: false, reason: "verifier_at_capacity" };
  }

  return { ok: true };
}
