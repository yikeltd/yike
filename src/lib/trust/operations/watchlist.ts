import type { SupabaseClient } from "@supabase/supabase-js";
import type { InternalRiskLevel } from "./constants";

export async function addToWatchlist(
  client: SupabaseClient,
  params: {
    entityType: string;
    entityId?: string | null;
    entityLabel: string;
    watchReason: string;
    riskLevel?: InternalRiskLevel;
    notes?: string;
    addedBy: string;
  }
): Promise<void> {
  await client.from("trust_watchlist").insert({
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    entity_label: params.entityLabel,
    watch_reason: params.watchReason,
    risk_level: params.riskLevel ?? "moderate",
    notes: params.notes ?? null,
    added_by: params.addedBy,
  });
}

export async function getActiveWatchlist(
  client: SupabaseClient,
  limit = 40
) {
  const { data } = await client
    .from("trust_watchlist")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
