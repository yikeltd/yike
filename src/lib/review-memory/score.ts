import type { Profile, Property } from "@/types/database";
import { analyzeListingQuality } from "@/lib/listing-quality";
import { computeFraudRiskScore } from "@/lib/pricing/quality-level";
import { isVerifiedAgentProfile } from "@/lib/agent-tiers";
import { scoreNaijaFlexibility } from "./naija-flex";
import { runTypeSpecificChecks, typeCheckScore } from "./type-checks";
import type { ReviewRiskLevel } from "./constants";

export type ReviewSubScores = {
  overall: number;
  photo: number;
  pricing: number;
  location: number;
  description: number;
  trustRisk: number;
  completion: number;
  naijaFlex: number;
};

export type ReviewJudgment = {
  scores: ReviewSubScores;
  riskLevel: ReviewRiskLevel;
  good: string[];
  attention: string[];
  typeSignals: ReturnType<typeof runTypeSpecificChecks>;
  naijaFlex: ReturnType<typeof scoreNaijaFlexibility>;
};

function scorePhotos(property: Property): number {
  let score = 40;
  const count = property.media_urls.length;
  score += Math.min(count, 8) * 7;
  score += Math.min(property.image_quality_score ?? 0, 100) * 0.2;
  const imgFlags = property.image_quality_flags ?? [];
  if (imgFlags.includes("few_images")) score -= 15;
  if (imgFlags.includes("low_resolution_hint")) score -= 10;
  if (imgFlags.includes("watermark_hint")) score -= 8;
  if (imgFlags.includes("duplicate_url")) score -= 20;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function scorePricing(property: Property): number {
  let score = 55;
  score += Math.min(property.price_confidence_score ?? 50, 100) * 0.35;
  if (property.price_anomaly_level === "unusually_low") score -= 25;
  if (property.price_anomaly_level === "unusually_high") score -= 12;
  if (property.price_review_status === "admin_review") score -= 10;
  if (Number(property.price) > 0) score += 10;
  const flags = analyzeListingQuality(property);
  if (flags.includes("suspicious_price_low")) score -= 20;
  if (flags.includes("suspicious_price_high")) score -= 12;
  if (flags.includes("call_for_price")) score -= 30;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function scoreLocation(property: Property): number {
  let score = 50;
  if (property.state?.trim()) score += 10;
  if (property.city?.trim()) score += 15;
  if (property.area?.trim() && property.area.length >= 3) score += 20;
  if (property.area?.length && property.area.length < 3) score -= 10;
  return Math.max(0, Math.min(100, score));
}

function scoreDescription(property: Property): number {
  const len = (property.description ?? "").trim().length;
  let score = 30;
  if (len >= 150) score += 45;
  else if (len >= 80) score += 30;
  else if (len >= 40) score += 18;
  else if (len > 0) score += 6;
  const flags = analyzeListingQuality(property);
  if (flags.includes("thin_description")) score -= 15;
  if (flags.includes("spam_phrase")) score -= 25;
  if (flags.includes("profanity")) score -= 40;
  return Math.max(0, Math.min(100, score));
}

function scoreTrustRisk(
  property: Property,
  agent?: Profile | null,
  naijaAbuseRisk = 0
): number {
  const fraud = computeFraudRiskScore(property);
  let risk = fraud;
  if (property.report_review_recommended) risk += 15;
  if (property.possible_duplicate && (property.duplicate_confidence_score ?? 0) >= 0.7) {
    risk += 20;
  }
  risk += naijaAbuseRisk * 0.5;
  if (agent && !isVerifiedAgentProfile(agent)) risk += 8;
  if (property.internal_risk_score) risk += property.internal_risk_score * 0.15;
  return Math.max(0, Math.min(100, Math.round(risk)));
}

function scoreCompletion(property: Property): number {
  let score = 0;
  const checks = [
    property.title?.trim(),
    Number(property.price) > 0,
    property.city?.trim(),
    property.area?.trim(),
    property.description?.trim(),
    property.media_urls.length >= 1,
    property.property_type,
    property.bedrooms != null,
    property.agent_id,
  ];
  const filled = checks.filter(Boolean).length;
  score = Math.round((filled / checks.length) * 100);
  if (property.media_urls.length >= 3) score += 8;
  if (property.extras && Object.keys(property.extras).length > 0) score += 5;
  return Math.max(0, Math.min(100, score));
}

function riskLevelFromScores(
  overall: number,
  trustRisk: number,
  naijaAbuse: number
): ReviewRiskLevel {
  if (trustRisk >= 75 || naijaAbuse >= 60) return "severe";
  if (trustRisk >= 55 || overall < 40) return "high";
  if (trustRisk >= 35 || overall < 55) return "moderate";
  return "low";
}

export function computeListingReviewJudgment(
  property: Property,
  context?: {
    agent?: Profile | null;
    agentVagueListingCount?: number;
    complaintCount?: number;
  }
): ReviewJudgment {
  const naijaFlex = scoreNaijaFlexibility(property, {
    agentVagueListingCount: context?.agentVagueListingCount,
    complaintCount: context?.complaintCount,
  });

  const photo = scorePhotos(property);
  const pricing = scorePricing(property);
  const location = scoreLocation(property);
  const description = scoreDescription(property);
  const completion = scoreCompletion(property);
  const trustRisk = scoreTrustRisk(property, context?.agent, naijaFlex.abuseRisk);

  const typeSignals = runTypeSpecificChecks(property);
  const typeScore = typeCheckScore(typeSignals);

  const overall = Math.round(
    photo * 0.15 +
      pricing * 0.18 +
      location * 0.12 +
      description * 0.1 +
      completion * 0.1 +
      naijaFlex.score * 0.12 +
      typeScore * 0.13 +
      (100 - trustRisk) * 0.1
  );

  const good: string[] = [];
  const attention: string[] = [];

  if (photo >= 70) good.push("Clear photos");
  else if (photo < 50) attention.push("Photos need improvement");

  if (location >= 75) good.push("Good location detail");
  else if (location < 55) attention.push("Location vague");

  if (pricing >= 70) good.push("Reasonable pricing signals");
  else if (pricing < 50) attention.push("Price unusual or unclear");

  if (description >= 65) good.push("Solid description");
  else if (description < 45) attention.push("Description too thin");

  if (completion >= 80) good.push("Listing mostly complete");
  else attention.push("Missing key details");

  if (context?.agent && isVerifiedAgentProfile(context.agent)) {
    good.push("Verified agent");
  }
  if (context?.agent?.whatsapp || context?.agent?.phone) {
    good.push("Contact available");
  }

  if (naijaFlex.isExplainableFlex) {
    good.push("Nigerian market flexibility explained");
  } else if (naijaFlex.vagueSignals.length > 0) {
    attention.push("Fees/terms vague without explanation");
  }

  for (const s of typeSignals) {
    if (s.positive && s.weight >= 6) good.push(s.label);
    if (!s.positive && s.weight <= -8) attention.push(s.label);
  }

  if (property.possible_duplicate) attention.push("Possible duplicate");
  if (property.price_anomaly_level) attention.push(`Price anomaly: ${property.price_anomaly_level}`);
  if (property.report_review_recommended) attention.push("User reports threshold reached");

  const riskLevel = riskLevelFromScores(overall, trustRisk, naijaFlex.abuseRisk);

  return {
    scores: {
      overall,
      photo,
      pricing,
      location,
      description,
      trustRisk,
      completion,
      naijaFlex: naijaFlex.score,
    },
    riskLevel,
    good: [...new Set(good)].slice(0, 8),
    attention: [...new Set(attention)].slice(0, 10),
    typeSignals,
    naijaFlex,
  };
}
