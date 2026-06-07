import type { SupabaseClient } from "@supabase/supabase-js";

export type BlacklistEntityType = "verifier" | "legal_partner" | "agent" | "company" | "buyer";

export async function isBlacklisted(
  client: SupabaseClient,
  entityType: BlacklistEntityType,
  entityId: string
): Promise<{ blocked: boolean; reason?: string }> {
  const { data } = await client
    .from("trust_blacklist")
    .select("reason, assignments_blocked")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .eq("active", true)
    .maybeSingle();

  if (!data?.assignments_blocked) return { blocked: false };
  return { blocked: true, reason: data.reason };
}

export async function addToBlacklist(
  client: SupabaseClient,
  params: {
    entityType: BlacklistEntityType;
    entityId: string;
    entityLabel?: string;
    reason: string;
    reasonCode?: string;
    payoutsFrozen?: boolean;
    addedBy: string;
  }
): Promise<string | null> {
  const { data, error } = await client
    .from("trust_blacklist")
    .insert({
      entity_type: params.entityType,
      entity_id: params.entityId,
      entity_label: params.entityLabel ?? null,
      reason: params.reason,
      reason_code: params.reasonCode ?? null,
      payouts_frozen: params.payoutsFrozen ?? false,
      assignments_blocked: true,
      added_by: params.addedBy,
    })
    .select("id")
    .single();

  if (error) return null;
  return data.id as string;
}
