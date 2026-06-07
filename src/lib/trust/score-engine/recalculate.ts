import type { SupabaseClient } from "@supabase/supabase-js";
import type { TrustEntityType } from "./constants";
import {
  applyManualOverrides,
  calculateEntityTrust,
} from "./calculate";
import { ensureTrustScoreRow, recordTrustScoreEvent } from "./events";

export async function upsertCalculatedTrustScore(
  client: SupabaseClient,
  entityType: TrustEntityType,
  entityId: string
): Promise<boolean> {
  const calculated = await calculateEntityTrust(client, entityType, entityId);
  if (!calculated) return false;

  const existing = await ensureTrustScoreRow(client, entityType, entityId);
  if (existing.score_frozen) return true;

  const final = applyManualOverrides(existing, calculated);
  const now = new Date().toISOString();

  await client
    .from("trust_scores")
    .update({
      trust_score: final.trust_score,
      risk_score: final.risk_score,
      confidence_score: final.confidence_score,
      trust_level: final.trust_level,
      last_calculated_at: now,
      updated_at: now,
    })
    .eq("id", existing.id);

  if (entityType === "listing") {
    await client
      .from("properties")
      .update({
        internal_trust_score: final.trust_score,
        internal_risk_score: final.risk_score,
      })
      .eq("id", entityId);
  }

  if (entityType === "agent") {
    await client
      .from("profiles")
      .update({ trust_score: Math.round(final.trust_score) })
      .eq("id", entityId);
  }

  return true;
}

export async function recalculateTrustScoresBatch(
  client: SupabaseClient,
  limit = 80
): Promise<Record<TrustEntityType, number>> {
  const counts: Record<TrustEntityType, number> = {
    agent: 0,
    company: 0,
    listing: 0,
    field_verifier: 0,
    legal_partner: 0,
    service_provider: 0,
  };

  const { data: agents } = await client
    .from("profiles")
    .select("id")
    .in("role", ["agent", "agent_unverified", "agent_verified"])
    .order("updated_at", { ascending: false })
    .limit(limit);

  for (const row of agents ?? []) {
    if (await upsertCalculatedTrustScore(client, "agent", row.id)) counts.agent++;
  }

  const { data: companies } = await client
    .from("profiles")
    .select("id")
    .in("account_type", ["agency", "developer"])
    .order("updated_at", { ascending: false })
    .limit(Math.floor(limit / 2));

  for (const row of companies ?? []) {
    if (await upsertCalculatedTrustScore(client, "company", row.id)) counts.company++;
  }

  const { data: listings } = await client
    .from("properties")
    .select("id")
    .in("status", ["approved", "pending", "flagged"])
    .order("updated_at", { ascending: false })
    .limit(limit);

  for (const row of listings ?? []) {
    if (await upsertCalculatedTrustScore(client, "listing", row.id)) counts.listing++;
  }

  const { data: verifiers } = await client
    .from("field_verifiers")
    .select("id")
    .in("status", ["approved", "paused", "fraud_review"])
    .limit(Math.floor(limit / 2));

  for (const row of verifiers ?? []) {
    if (await upsertCalculatedTrustScore(client, "field_verifier", row.id))
      counts.field_verifier++;
  }

  const { data: partners } = await client
    .from("legal_partners")
    .select("id")
    .in("status", ["approved", "paused", "fraud_review"])
    .limit(Math.floor(limit / 2));

  for (const row of partners ?? []) {
    if (await upsertCalculatedTrustScore(client, "legal_partner", row.id))
      counts.legal_partner++;
  }

  const { data: serviceProviders } = await client
    .from("service_provider_profiles")
    .select("id")
    .in("verification_status", ["approved", "paused", "suspended", "fraud_review", "pending"])
    .limit(Math.floor(limit / 2));

  for (const row of serviceProviders ?? []) {
    if (await upsertCalculatedTrustScore(client, "service_provider", row.id))
      counts.service_provider++;
  }

  return counts;
}

export async function adminOverrideTrustScore(
  client: SupabaseClient,
  input: {
    entityType: TrustEntityType;
    entityId: string;
    actorId: string;
    action:
      | "freeze"
      | "unfreeze"
      | "reset"
      | "override"
      | "escalate"
      | "mark_trusted";
    trustScore?: number;
    riskScore?: number;
    trustLevel?: string;
    adminNotes?: string;
  }
): Promise<void> {
  const row = await ensureTrustScoreRow(client, input.entityType, input.entityId);
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updated_at: now, last_calculated_at: now };

  switch (input.action) {
    case "freeze":
      patch.score_frozen = true;
      await recordTrustScoreEvent(client, {
        entityType: input.entityType,
        entityId: input.entityId,
        eventType: "score_frozen",
        reason: "Admin frozen trust score",
        actorId: input.actorId,
      });
      break;
    case "unfreeze":
      patch.score_frozen = false;
      break;
    case "reset":
      patch.manual_trust_score = null;
      patch.manual_risk_score = null;
      patch.manual_trust_level = null;
      patch.trust_score = 50;
      patch.risk_score = 0;
      patch.confidence_score = 10;
      patch.trust_level = "neutral";
      await recordTrustScoreEvent(client, {
        entityType: input.entityType,
        entityId: input.entityId,
        eventType: "score_reset",
        reason: "Admin reset trust score",
        scoreDelta: 0,
        actorId: input.actorId,
      });
      break;
    case "override":
      if (input.trustScore != null) patch.manual_trust_score = input.trustScore;
      if (input.riskScore != null) patch.manual_risk_score = input.riskScore;
      if (input.trustLevel) patch.manual_trust_level = input.trustLevel;
      if (input.trustScore != null) patch.trust_score = input.trustScore;
      if (input.riskScore != null) patch.risk_score = input.riskScore;
      if (input.trustLevel) patch.trust_level = input.trustLevel;
      await recordTrustScoreEvent(client, {
        entityType: input.entityType,
        entityId: input.entityId,
        eventType: "admin_override",
        reason: input.adminNotes ?? "Admin manual override",
        actorId: input.actorId,
      });
      break;
    case "escalate":
      patch.escalated = true;
      if (input.adminNotes) patch.admin_notes = input.adminNotes;
      break;
    case "mark_trusted":
      patch.manual_trust_level = "trusted";
      patch.trust_level = "trusted";
      patch.trust_score = Math.max(Number(row.trust_score), 75);
      await recordTrustScoreEvent(client, {
        entityType: input.entityType,
        entityId: input.entityId,
        eventType: "manual_trusted",
        reason: input.adminNotes ?? "Admin marked as trusted",
        scoreDelta: 5,
        riskDelta: -5,
        actorId: input.actorId,
      });
      break;
  }

  if (input.adminNotes && input.action !== "escalate") {
    patch.admin_notes = input.adminNotes;
  }

  await client.from("trust_scores").update(patch).eq("id", row.id);

  if (input.action === "reset" || input.action === "override" || input.action === "mark_trusted") {
    await upsertCalculatedTrustScore(client, input.entityType, input.entityId);
  }
}
