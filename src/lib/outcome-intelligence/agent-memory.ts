import type { SupabaseClient } from "@supabase/supabase-js";
import { agentStrictnessFromQuality } from "./compute";

export async function recalculateAgentOutcomeMemory(
  client: SupabaseClient,
  agentId: string
): Promise<void> {
  const { data: listings } = await client
    .from("properties")
    .select(
      "outcome_score, outcome_evolution_delta, status, contact_clicks, views_count"
    )
    .eq("agent_id", agentId)
    .in("status", ["approved", "hidden", "rented", "rejected"]);

  const withOutcome = (listings ?? []).filter((l) => l.outcome_score != null);
  const avgOutcome =
    withOutcome.length > 0
      ? withOutcome.reduce((s, l) => s + (l.outcome_score ?? 50), 0) /
        withOutcome.length
      : 50;

  const positive = withOutcome.filter((l) => (l.outcome_evolution_delta ?? 0) > 0).length;
  const negative = withOutcome.filter((l) => (l.outcome_evolution_delta ?? 0) < 0).length;

  const { data: metrics } = await client
    .from("agent_trust_metrics")
    .select(
      "complaint_count, rejected_listing_count, response_rate, successful_inquiries, stale_listing_ratio"
    )
    .eq("profile_id", agentId)
    .maybeSingle();

  let qualityScore = Math.round(avgOutcome);
  if ((metrics?.successful_inquiries ?? 0) >= 5) qualityScore += 5;
  if ((metrics?.complaint_count ?? 0) >= 3) qualityScore -= 10;
  if ((metrics?.rejected_listing_count ?? 0) >= 3) qualityScore -= 8;
  if ((metrics?.response_rate ?? 0) >= 0.7) qualityScore += 4;
  if ((metrics?.stale_listing_ratio ?? 0) >= 0.5) qualityScore -= 6;

  qualityScore = Math.max(0, Math.min(100, qualityScore));

  const now = new Date().toISOString();
  await client.from("agent_outcome_memory").upsert(
    {
      agent_id: agentId,
      quality_score: qualityScore,
      review_strictness_modifier: agentStrictnessFromQuality(qualityScore),
      positive_signal_count: positive,
      negative_signal_count: negative,
      outcome_summary: {
        avg_outcome_score: Math.round(avgOutcome),
        listing_sample: withOutcome.length,
        complaint_count: metrics?.complaint_count ?? 0,
        response_rate: metrics?.response_rate ?? null,
      },
      last_calculated_at: now,
      updated_at: now,
    },
    { onConflict: "agent_id" }
  );
}
