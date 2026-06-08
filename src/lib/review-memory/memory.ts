import type { SupabaseClient } from "@supabase/supabase-js";
import type { Property } from "@/types/database";
import type { ReviewDecisionType } from "./constants";
import type { ReviewJudgment } from "./score";

export type ReviewMemoryRow = {
  id: string;
  listing_id: string;
  agent_id: string | null;
  decision_type: ReviewDecisionType;
  decision_reason: string | null;
  signals: Record<string, unknown>;
  property_type: string | null;
  listing_type: string | null;
  scores_snapshot: Record<string, unknown> | null;
  admin_id: string | null;
  created_at: string;
};

export async function saveReviewDecision(
  client: SupabaseClient,
  input: {
    listing: Property;
    judgment?: ReviewJudgment;
    decisionType: ReviewDecisionType;
    decisionReason?: string;
    adminId?: string | null;
    extraSignals?: Record<string, unknown>;
  }
): Promise<void> {
  const signals: Record<string, unknown> = {
    moderation_flags: input.listing.moderation_flags ?? [],
    price_anomaly_level: input.listing.price_anomaly_level,
    possible_duplicate: input.listing.possible_duplicate,
    ...input.extraSignals,
  };

  if (input.judgment) {
    signals.good = input.judgment.good;
    signals.attention = input.judgment.attention;
    signals.naija_flex = input.judgment.naijaFlex;
  }

  await client.from("listing_review_memory").insert({
    listing_id: input.listing.id,
    agent_id: input.listing.agent_id,
    decision_type: input.decisionType,
    decision_reason: input.decisionReason ?? null,
    signals,
    property_type: input.listing.property_type,
    listing_type: input.listing.listing_type,
    scores_snapshot: input.judgment?.scores ?? null,
    admin_id: input.adminId ?? null,
  });
}

export async function getAgentReviewMemory(
  client: SupabaseClient,
  agentId: string,
  limit = 20
): Promise<ReviewMemoryRow[]> {
  const { data } = await client
    .from("listing_review_memory")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as ReviewMemoryRow[];
}

export async function countAgentVagueDecisions(
  client: SupabaseClient,
  agentId: string
): Promise<number> {
  const vagueTypes: ReviewDecisionType[] = [
    "requested_fee_clarity",
    "requested_explanation",
    "requested_update",
    "rejected_bait_pricing",
  ];

  const { count } = await client
    .from("listing_review_memory")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", agentId)
    .in("decision_type", vagueTypes);

  return count ?? 0;
}

export function memoryBoostFromHistory(
  memories: ReviewMemoryRow[]
): { naijaFlexBoost: number; trustBoost: number } {
  let naijaFlexBoost = 0;
  let trustBoost = 0;

  for (const m of memories.slice(0, 10)) {
    if (m.decision_type === "approved_negotiable_landlord_terms") naijaFlexBoost += 4;
    if (m.decision_type === "approved_after_explanation") {
      naijaFlexBoost += 3;
      trustBoost += 2;
    }
    if (m.decision_type === "rejected_fake_location") trustBoost -= 5;
    if (m.decision_type === "rejected_duplicate_photos") trustBoost -= 4;
  }

  return {
    naijaFlexBoost: Math.min(15, naijaFlexBoost),
    trustBoost: Math.max(-20, Math.min(10, trustBoost)),
  };
}
