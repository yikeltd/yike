import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_RISK_SCORE,
  DEFAULT_TRUST_SCORE,
  TRUST_EVENT_DELTAS,
  type TrustEntityType,
  type TrustEventType,
} from "./constants";
import {
  clampScore,
  confidenceFromEventCount,
  trustLevelFromScores,
} from "./levels";

export type TrustScoreRow = {
  id: string;
  entity_type: TrustEntityType;
  entity_id: string;
  trust_score: number;
  risk_score: number;
  confidence_score: number;
  trust_level: string;
  event_count: number;
  score_frozen: boolean;
  manual_trust_score: number | null;
  manual_risk_score: number | null;
  manual_trust_level: string | null;
  escalated: boolean;
  admin_notes: string | null;
  last_calculated_at: string | null;
};

export async function ensureTrustScoreRow(
  client: SupabaseClient,
  entityType: TrustEntityType,
  entityId: string
): Promise<TrustScoreRow> {
  const { data: existing } = await client
    .from("trust_scores")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .maybeSingle();

  if (existing) return existing as TrustScoreRow;

  const now = new Date().toISOString();
  const { data: created, error } = await client
    .from("trust_scores")
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      trust_score: DEFAULT_TRUST_SCORE,
      risk_score: DEFAULT_RISK_SCORE,
      confidence_score: 10,
      trust_level: "neutral",
      last_calculated_at: now,
    })
    .select("*")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "Could not create trust score row");
  }
  return created as TrustScoreRow;
}

export async function recordTrustScoreEvent(
  client: SupabaseClient,
  input: {
    entityType: TrustEntityType;
    entityId: string;
    eventType: TrustEventType;
    reason: string;
    scoreDelta?: number;
    riskDelta?: number;
    confidenceDelta?: number;
    metadata?: Record<string, unknown>;
    actorId?: string | null;
  }
): Promise<{ ok: boolean; row?: TrustScoreRow }> {
  const preset = TRUST_EVENT_DELTAS[input.eventType];
  const scoreDelta = input.scoreDelta ?? preset?.score_delta ?? 0;
  const riskDelta = input.riskDelta ?? preset?.risk_delta ?? 0;
  const confidenceDelta = input.confidenceDelta ?? preset?.confidence_delta ?? 1;

  await client.from("trust_score_events").insert({
    entity_type: input.entityType,
    entity_id: input.entityId,
    event_type: input.eventType,
    score_delta: scoreDelta,
    risk_delta: riskDelta,
    confidence_delta: confidenceDelta,
    reason: input.reason,
    metadata: input.metadata ?? {},
    actor_id: input.actorId ?? null,
  });

  const row = await ensureTrustScoreRow(client, input.entityType, input.entityId);
  if (row.score_frozen) return { ok: true, row };

  const eventCount = row.event_count + 1;
  let trustScore = clampScore(Number(row.trust_score) + scoreDelta);
  let riskScore = clampScore(Number(row.risk_score) + riskDelta);
  const confidenceScore = clampScore(
    confidenceFromEventCount(eventCount) + confidenceDelta,
    0,
    95
  );

  if (row.manual_trust_score != null) trustScore = Number(row.manual_trust_score);
  if (row.manual_risk_score != null) riskScore = Number(row.manual_risk_score);

  const trustLevel =
    row.manual_trust_level ??
    trustLevelFromScores(trustScore, riskScore, confidenceScore);

  const now = new Date().toISOString();
  const { data: updated } = await client
    .from("trust_scores")
    .update({
      trust_score: trustScore,
      risk_score: riskScore,
      confidence_score: confidenceScore,
      trust_level: trustLevel,
      event_count: eventCount,
      last_calculated_at: now,
      updated_at: now,
    })
    .eq("id", row.id)
    .select("*")
    .single();

  if (input.entityType === "listing") {
    await client
      .from("properties")
      .update({
        internal_trust_score: trustScore,
        internal_risk_score: riskScore,
      })
      .eq("id", input.entityId);
  }

  return { ok: true, row: (updated ?? row) as TrustScoreRow };
}
