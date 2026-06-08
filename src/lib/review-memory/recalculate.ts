import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, Property } from "@/types/database";
import { isVerifiedAgentProfile } from "@/lib/agent-tiers";
import { computeListingReviewJudgment } from "./score";
import { assignQueueGroup, suggestReviewAction } from "./suggest";
import {
  countAgentVagueDecisions,
  getAgentReviewMemory,
  memoryBoostFromHistory,
} from "./memory";
import { applyOutcomeToReviewScore } from "@/lib/outcome-intelligence/compute";
import { getAreaOutcomeBoost } from "@/lib/outcome-intelligence/area-memory";

export async function recalculateListingReview(
  client: SupabaseClient,
  property: Property & { agent?: Profile | null }
): Promise<{
  judgment: ReturnType<typeof computeListingReviewJudgment>;
  suggestedAction: ReturnType<typeof suggestReviewAction>;
  queueGroup: ReturnType<typeof assignQueueGroup>;
  outcomeDelta: number;
  outcomeScore: number | null;
}> {
  let agentVagueListingCount = 0;
  let complaintCount = 0;
  let agentStrictness = 0;

  if (property.agent_id) {
    agentVagueListingCount = await countAgentVagueDecisions(
      client,
      property.agent_id
    );
    const { data: metrics } = await client
      .from("agent_trust_metrics")
      .select("moderation_flags")
      .eq("profile_id", property.agent_id)
      .maybeSingle();
    complaintCount = metrics?.moderation_flags ?? 0;

    const { data: agentOutcome } = await client
      .from("agent_outcome_memory")
      .select("review_strictness_modifier, quality_score")
      .eq("agent_id", property.agent_id)
      .maybeSingle();
    agentStrictness = agentOutcome?.review_strictness_modifier ?? 0;
  }

  const areaBoost = await getAreaOutcomeBoost(client, property);

  const memories = property.agent_id
    ? await getAgentReviewMemory(client, property.agent_id, 10)
    : [];
  const boost = memoryBoostFromHistory(memories);

  const judgment = computeListingReviewJudgment(property, {
    agent: property.agent,
    agentVagueListingCount,
    complaintCount,
  });

  judgment.scores.naijaFlex = Math.min(
    100,
    judgment.scores.naijaFlex + boost.naijaFlexBoost
  );
  let overall = Math.min(
    100,
    judgment.scores.overall + Math.round(boost.trustBoost * 0.5)
  );

  const outcomeDelta = property.outcome_evolution_delta ?? 0;
  if (outcomeDelta !== 0 || property.outcome_score != null) {
    overall = applyOutcomeToReviewScore(overall, outcomeDelta);
    overall += areaBoost.trustBoost + areaBoost.pricingBoost;
    overall -= areaBoost.fraudPenalty;
    if (agentStrictness < 0) overall += Math.abs(agentStrictness) * 0.3;
    else if (agentStrictness > 0) overall -= agentStrictness * 0.4;
    overall = Math.max(0, Math.min(100, Math.round(overall)));
  }

  judgment.scores.overall = overall;

  if (property.outcome_signals) {
    const os = property.outcome_signals as {
      positive?: string[];
      negative?: string[];
    };
    if (os.positive?.length) {
      judgment.good.push(...os.positive.slice(0, 2));
    }
    if (os.negative?.length) {
      judgment.attention.push(...os.negative.slice(0, 2));
    }
    judgment.good = [...new Set(judgment.good)].slice(0, 8);
    judgment.attention = [...new Set(judgment.attention)].slice(0, 10);
  }

  const suggestedAction = suggestReviewAction(judgment);
  const queueGroup = assignQueueGroup(judgment, {
    agentTrusted: property.agent
      ? isVerifiedAgentProfile(property.agent)
      : false,
  });

  return {
    judgment,
    suggestedAction,
    queueGroup,
    outcomeDelta,
    outcomeScore: property.outcome_score ?? null,
  };
}

export async function persistListingReviewScores(
  client: SupabaseClient,
  propertyId: string,
  result: Awaited<ReturnType<typeof recalculateListingReview>>
): Promise<void> {
  const { judgment, suggestedAction, queueGroup } = result;
  const now = new Date().toISOString();

  await client
    .from("properties")
    .update({
      review_overall_score: judgment.scores.overall,
      review_risk_level: judgment.riskLevel,
      review_suggested_action: suggestedAction,
      review_queue_group: queueGroup,
      review_scores: {
        ...judgment.scores,
        good: judgment.good,
        attention: judgment.attention,
        outcome_score: result.outcomeScore,
        outcome_delta: result.outcomeDelta,
      },
      review_scores_updated_at: now,
    })
    .eq("id", propertyId);
}
