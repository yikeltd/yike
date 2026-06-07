import type { SupabaseClient } from "@supabase/supabase-js";
import type { InternalRiskLevel } from "./constants";

export type RiskSignal = {
  code: string;
  weight: number;
  detail?: string;
};

export function scoreToLevel(score: number): InternalRiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "elevated";
  if (score >= 20) return "moderate";
  return "low";
}

export function assessPropertyVerificationRisk(input: {
  concernFlags?: Record<string, boolean> | null;
  buyerContext?: Record<string, boolean> | null;
  isDiaspora?: boolean;
  priority?: string;
  status?: string;
  alreadyPaid?: boolean;
}): { level: InternalRiskLevel; score: number; signals: RiskSignal[] } {
  const signals: RiskSignal[] = [];
  let score = 0;

  const flags = input.concernFlags ?? {};
  if (flags.scam_worry) {
    signals.push({ code: "repeated_complaints", weight: 15, detail: "Scam worry flagged" });
    score += 15;
  }
  if (flags.fake_pictures) {
    signals.push({ code: "fake_photo_reports", weight: 20 });
    score += 20;
  }
  if (flags.land_ownership) {
    signals.push({ code: "legal_concerns", weight: 12 });
    score += 12;
  }
  if (flags.already_paid || input.alreadyPaid) {
    signals.push({ code: "already_paid", weight: 25 });
    score += 25;
  }
  if (flags.urgent_relocation) {
    signals.push({ code: "unusual_urgency", weight: 10 });
    score += 10;
  }

  const ctx = input.buyerContext ?? {};
  if (ctx.outside_nigeria || input.isDiaspora) {
    signals.push({ code: "diaspora_risk", weight: 8, detail: "Diaspora — higher trust sensitivity" });
    score += 8;
  }

  if (input.priority === "urgent" || input.priority === "high") {
    signals.push({ code: "unusual_urgency", weight: 8 });
    score += 8;
  }

  if (input.status === "fraud_review") {
    signals.push({ code: "fraud_review", weight: 40 });
    score += 40;
  }

  return { level: scoreToLevel(score), score: Math.min(100, score), signals };
}

export async function persistRiskAssessment(
  client: SupabaseClient,
  params: {
    entityType: string;
    entityId: string;
    entityReference?: string | null;
    level: InternalRiskLevel;
    score: number;
    signals: RiskSignal[];
    assessedBy?: string | null;
    notes?: string | null;
  }
): Promise<void> {
  await client.from("trust_risk_assessments").upsert(
    {
      entity_type: params.entityType,
      entity_id: params.entityId,
      entity_reference: params.entityReference ?? null,
      risk_level: params.level,
      risk_score: params.score,
      signals: params.signals,
      assessed_by: params.assessedBy ?? null,
      notes: params.notes ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "entity_type,entity_id" }
  );
}

export async function syncRequestInternalRisk(
  client: SupabaseClient,
  table: "property_verification_requests" | "legal_verification_requests",
  requestId: string,
  level: InternalRiskLevel
): Promise<void> {
  await client.from(table).update({ internal_risk_level: level }).eq("id", requestId);
}
