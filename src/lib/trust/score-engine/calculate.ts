import type { SupabaseClient } from "@supabase/supabase-js";
import { isVerifiedAgentProfile } from "@/lib/agent-tiers";
import type { Property, Profile } from "@/types/database";
import {
  DEFAULT_RISK_SCORE,
  DEFAULT_TRUST_SCORE,
  type TrustEntityType,
} from "./constants";
import {
  applyInactivityDecay,
  clampScore,
  confidenceFromEventCount,
  trustLevelFromScores,
} from "./levels";
import type { TrustScoreRow } from "./events";

export type CalculatedTrust = {
  trust_score: number;
  risk_score: number;
  confidence_score: number;
  trust_level: string;
};

export async function calculateAgentTrust(
  client: SupabaseClient,
  agentId: string
): Promise<CalculatedTrust | null> {
  const { data: agent } = await client
    .from("profiles")
    .select("*")
    .eq("id", agentId)
    .single();

  if (!agent) return null;
  const profile = agent as Profile;

  const [{ count: activeListings }, { count: flaggedListings }, { count: rejectedListings }] =
    await Promise.all([
      client
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", agentId)
        .eq("status", "approved")
        .gt("expires_at", new Date().toISOString()),
      client
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", agentId)
        .eq("status", "flagged"),
      client
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", agentId)
        .eq("status", "rejected"),
    ]);

  const { data: leadStats } = await client
    .from("leads")
    .select("inquiry_status")
    .eq("agent_id", agentId)
    .gte("clicked_at", new Date(Date.now() - 90 * 86_400_000).toISOString());

  const leads = leadStats ?? [];
  const responded = leads.filter(
    (l) => l.inquiry_status === "responded" || l.inquiry_status === "resolved"
  ).length;
  const responseRate = leads.length > 0 ? responded / leads.length : 0;

  let trust = DEFAULT_TRUST_SCORE;
  let risk = DEFAULT_RISK_SCORE;

  if (isVerifiedAgentProfile(profile)) trust += 18;
  trust += Math.min(12, (activeListings ?? 0) * 2);
  trust += responseRate * 18;
  if (responseRate >= 0.7) trust += 2;

  const complaintCount = profile.complaint_count ?? 0;
  trust -= Math.min(18, complaintCount * 4);
  trust -= Math.min(12, (flaggedListings ?? 0) * 4);
  trust -= Math.min(8, (rejectedListings ?? 0) * 2);

  risk += Math.min(30, complaintCount * 6);
  risk += Math.min(20, (flaggedListings ?? 0) * 5);
  if (profile.account_status === "suspended") risk += 25;

  const ageDays =
    (Date.now() - new Date(profile.created_at).getTime()) / 86_400_000;
  let confidence = confidenceFromEventCount(
    (activeListings ?? 0) + leads.length,
    ageDays
  );
  if (profile.last_activity_at) {
    const inactiveDays =
      (Date.now() - new Date(profile.last_activity_at).getTime()) / 86_400_000;
    confidence = applyInactivityDecay(confidence, inactiveDays);
  }

  trust = clampScore(trust);
  risk = clampScore(risk);

  return {
    trust_score: trust,
    risk_score: risk,
    confidence_score: confidence,
    trust_level: trustLevelFromScores(trust, risk, confidence),
  };
}

export async function calculateCompanyTrust(
  client: SupabaseClient,
  companyId: string
): Promise<CalculatedTrust | null> {
  const { data: profile } = await client
    .from("profiles")
    .select("*")
    .eq("id", companyId)
    .single();

  if (!profile) return null;

  const { data: team } = await client
    .from("profiles")
    .select("id")
    .eq("parent_company_id", companyId);

  const agentIds = [companyId, ...(team?.map((t) => t.id) ?? [])];

  const { count: activeListings } = await client
    .from("properties")
    .select("id", { count: "exact", head: true })
    .in("agent_id", agentIds)
    .eq("status", "approved")
    .gt("expires_at", new Date().toISOString());

  const { data: verification } = await client
    .from("company_verification_requests")
    .select("status")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let trust = DEFAULT_TRUST_SCORE;
  let risk = DEFAULT_RISK_SCORE;

  if (verification?.status === "approved") trust += 15;
  if (profile.verification_status === "approved") trust += 10;
  trust += Math.min(10, (activeListings ?? 0));

  const complaintCount = profile.complaint_count ?? 0;
  trust -= Math.min(15, complaintCount * 4);
  risk += Math.min(25, complaintCount * 5);

  const ageDays =
    (Date.now() - new Date(profile.created_at).getTime()) / 86_400_000;
  const confidence = confidenceFromEventCount(activeListings ?? 0, ageDays);

  trust = clampScore(trust);
  risk = clampScore(risk);

  return {
    trust_score: trust,
    risk_score: risk,
    confidence_score: confidence,
    trust_level: trustLevelFromScores(trust, risk, confidence),
  };
}

export async function calculateListingTrust(
  client: SupabaseClient,
  listingId: string
): Promise<CalculatedTrust | null> {
  const { data: row } = await client
    .from("properties")
    .select("*")
    .eq("id", listingId)
    .single();

  if (!row) return null;
  const property = row as Property;

  let trust = DEFAULT_TRUST_SCORE;
  let risk = property.fraud_risk_score ?? DEFAULT_RISK_SCORE;

  if (property.yike_verified || property.is_verified_listing) trust += 8;
  if (property.internal_trust_status === "physically_reviewed") trust += 6;
  if (property.internal_trust_status === "suspicious") {
    trust -= 8;
    risk += 15;
  }
  if (property.internal_trust_status === "high_risk") {
    trust -= 15;
    risk += 25;
  }

  trust += Math.min(8, (property.image_quality_score ?? 50) / 12);
  trust += Math.min(6, (property.freshness_score ?? 50) / 15);
  trust += Math.min(5, (property.engagement_score ?? 0) / 20);

  if (property.listing_activity_status === "stale") {
    trust -= 4;
    risk += 4;
  }
  if (property.possible_duplicate) {
    trust -= 6;
    risk += 12;
  }
  if (property.report_review_recommended) risk += 10;

  const { count: reportCount } = await client
    .from("listing_reports")
    .select("id", { count: "exact", head: true })
    .eq("property_id", listingId);

  risk += Math.min(20, (reportCount ?? 0) * 5);
  trust -= Math.min(12, (reportCount ?? 0) * 3);

  const ageDays =
    (Date.now() - new Date(property.created_at).getTime()) / 86_400_000;
  const confidence = confidenceFromEventCount(
    (property.views_count ?? 0) > 10 ? 8 : 3,
    ageDays
  );

  trust = clampScore(trust);
  risk = clampScore(risk);

  return {
    trust_score: trust,
    risk_score: risk,
    confidence_score: confidence,
    trust_level: trustLevelFromScores(trust, risk, confidence),
  };
}

export async function calculateFieldVerifierTrust(
  client: SupabaseClient,
  verifierId: string
): Promise<CalculatedTrust | null> {
  const { data: verifier } = await client
    .from("field_verifiers")
    .select("*")
    .eq("id", verifierId)
    .single();

  if (!verifier) return null;

  let trust = DEFAULT_TRUST_SCORE + 10;
  let risk = (verifier.fraud_flags_count ?? 0) * 8;

  trust += Math.min(15, (verifier.completed_inspections ?? 0) * 0.5);
  trust += Math.min(10, Number(verifier.performance_score ?? 50) / 8);
  trust += Math.min(8, Number(verifier.response_score ?? 50) / 10);

  if (verifier.status === "fraud_review") {
    trust -= 15;
    risk += 30;
  }
  if (verifier.status === "paused") {
    trust -= 5;
    risk += 8;
  }

  const ageDays = verifier.created_at
    ? (Date.now() - new Date(verifier.created_at).getTime()) / 86_400_000
    : 0;
  let confidence = confidenceFromEventCount(
    verifier.completed_inspections ?? 0,
    ageDays
  );
  if (verifier.last_activity_at) {
    const inactiveDays =
      (Date.now() - new Date(verifier.last_activity_at).getTime()) / 86_400_000;
    confidence = applyInactivityDecay(confidence, inactiveDays);
  }

  trust = clampScore(trust);
  risk = clampScore(risk);

  return {
    trust_score: trust,
    risk_score: risk,
    confidence_score: confidence,
    trust_level: trustLevelFromScores(trust, risk, confidence),
  };
}

export async function calculateLegalPartnerTrust(
  client: SupabaseClient,
  partnerId: string
): Promise<CalculatedTrust | null> {
  const { data: partner } = await client
    .from("legal_partners")
    .select("*")
    .eq("id", partnerId)
    .single();

  if (!partner) return null;

  let trust = DEFAULT_TRUST_SCORE + 10;
  let risk = (partner.fraud_flags_count ?? 0) * 8;

  trust += Math.min(15, (partner.completed_reviews ?? 0) * 0.5);
  trust += Math.min(10, Number(partner.performance_score ?? 50) / 8);

  if (partner.status === "fraud_review") {
    trust -= 15;
    risk += 30;
  }

  const ageDays = partner.created_at
    ? (Date.now() - new Date(partner.created_at).getTime()) / 86_400_000
    : 0;
  const confidence = confidenceFromEventCount(
    partner.completed_reviews ?? 0,
    ageDays
  );

  trust = clampScore(trust);
  risk = clampScore(risk);

  return {
    trust_score: trust,
    risk_score: risk,
    confidence_score: confidence,
    trust_level: trustLevelFromScores(trust, risk, confidence),
  };
}

export async function calculateServiceProviderTrust(
  client: SupabaseClient,
  providerId: string
): Promise<CalculatedTrust | null> {
  const { data: provider } = await client
    .from("service_provider_profiles")
    .select("*")
    .eq("id", providerId)
    .single();

  if (!provider) return null;

  let trust = DEFAULT_TRUST_SCORE;
  let risk = DEFAULT_RISK_SCORE;

  if (provider.verification_status === "approved") trust += 12;
  if (provider.trust_status === "trusted") trust += 8;
  if (provider.trust_status === "high_risk" || provider.trust_status === "fraud_review") {
    trust -= 15;
    risk += 25;
  }
  trust += Math.min(10, (provider.total_jobs ?? 0) * 0.5);
  if (provider.average_rating != null) {
    trust += Math.min(12, (Number(provider.average_rating) - 3) * 4);
  }
  trust -= Math.min(15, (provider.complaint_count ?? 0) * 4);
  risk += Math.min(30, (provider.complaint_count ?? 0) * 6);

  if (provider.verification_status === "suspended") {
    trust -= 20;
    risk += 20;
  }
  if (provider.verification_status === "fraud_review") {
    trust -= 15;
    risk += 30;
  }

  const ageDays = provider.created_at
    ? (Date.now() - new Date(provider.created_at).getTime()) / 86_400_000
    : 0;
  let confidence = confidenceFromEventCount(provider.total_jobs ?? 0, ageDays);
  if (provider.last_activity_at) {
    const inactiveDays =
      (Date.now() - new Date(provider.last_activity_at).getTime()) / 86_400_000;
    confidence = applyInactivityDecay(confidence, inactiveDays);
  }

  trust = clampScore(trust);
  risk = clampScore(risk);

  return {
    trust_score: trust,
    risk_score: risk,
    confidence_score: confidence,
    trust_level: trustLevelFromScores(trust, risk, confidence),
  };
}

export async function calculateEntityTrust(
  client: SupabaseClient,
  entityType: TrustEntityType,
  entityId: string
): Promise<CalculatedTrust | null> {
  switch (entityType) {
    case "agent":
      return calculateAgentTrust(client, entityId);
    case "company":
      return calculateCompanyTrust(client, entityId);
    case "listing":
      return calculateListingTrust(client, entityId);
    case "field_verifier":
      return calculateFieldVerifierTrust(client, entityId);
    case "legal_partner":
      return calculateLegalPartnerTrust(client, entityId);
    case "service_provider":
      return calculateServiceProviderTrust(client, entityId);
    default:
      return null;
  }
}

export function applyManualOverrides(
  row: TrustScoreRow,
  calculated: CalculatedTrust
): CalculatedTrust {
  const trust_score =
    row.manual_trust_score != null
      ? Number(row.manual_trust_score)
      : calculated.trust_score;
  const risk_score =
    row.manual_risk_score != null
      ? Number(row.manual_risk_score)
      : calculated.risk_score;
  const trust_level =
    row.manual_trust_level ??
    trustLevelFromScores(trust_score, risk_score, calculated.confidence_score);

  return {
    trust_score,
    risk_score,
    confidence_score: calculated.confidence_score,
    trust_level,
  };
}
