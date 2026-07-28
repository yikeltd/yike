/**
 * Intelligence Platform — Deterministic Scoring Engine (Phase 1.9)
 *
 * Provides transparent, rule-driven scoring for Listing Quality, Deal Health, Lead Quality, and Case Urgency.
 */

import type { DealHealthAnalysis, DealMomentum, OperationsCasePriority, SellerListingScore } from "./types";

/** Compute Listing Quality Score (0–100) */
export function calculateListingQualityScore(listing: {
  title?: string;
  description?: string;
  images?: string[];
  price?: number;
  location?: string;
}): SellerListingScore {
  let titleQuality = 0;
  let photoQuality = 0;
  let pricingCompetitiveness = 70; // baseline
  const recommendations: string[] = [];

  const title = listing.title?.trim() || "";
  if (title.length >= 20) titleQuality = 100;
  else if (title.length >= 10) titleQuality = 70;
  else {
    titleQuality = 40;
    recommendations.push("Expand listing title with key features (e.g. '3-Bedroom Apartment in Lekki Phase 1')");
  }

  const imageCount = listing.images?.length ?? 0;
  if (imageCount >= 5) photoQuality = 100;
  else if (imageCount >= 2) photoQuality = 75;
  else {
    photoQuality = 30;
    recommendations.push("Upload at least 3-5 clear, high-resolution photos");
  }

  if (listing.price && listing.price > 0) pricingCompetitiveness += 15;
  else {
    pricingCompetitiveness = 20;
    recommendations.push("Add clear transparent price to rank higher in buyer searches");
  }

  const qualityScore = Math.round(titleQuality * 0.3 + photoQuality * 0.4 + pricingCompetitiveness * 0.3);

  return {
    listingId: "listing_sample",
    qualityScore,
    titleQuality,
    photoQuality,
    pricingCompetitiveness,
    recommendations,
  };
}

/** Compute Deal Health Score (0–100) and closing probability */
export function calculateDealHealth(deal: {
  id: string;
  stage: string;
  daysInStage: number;
  offersCount: number;
  hasInspection: boolean;
  hasViewing: boolean;
}): DealHealthAnalysis {
  let healthScore = 70;
  let probabilityOfClosing = 50;
  let momentum: DealMomentum = "stable";
  const warnings: string[] = [];

  if (deal.daysInStage <= 3) {
    momentum = "accelerating";
    healthScore += 15;
    probabilityOfClosing += 15;
  } else if (deal.daysInStage >= 7) {
    momentum = "stalled";
    healthScore -= 20;
    probabilityOfClosing -= 15;
    warnings.push(`Deal has been in ${deal.stage} for ${deal.daysInStage} days. Prompt buyer follow-up.`);
  }

  if (deal.daysInStage >= 14) {
    momentum = "at_risk";
    healthScore -= 25;
    probabilityOfClosing -= 20;
    warnings.push("High risk of deal abandonment due to inactivity.");
  }

  if (deal.hasViewing) {
    healthScore += 10;
    probabilityOfClosing += 15;
  } else {
    warnings.push("No physical viewing scheduled yet.");
  }

  if (deal.hasInspection) {
    healthScore += 15;
    probabilityOfClosing += 15;
  }

  healthScore = Math.max(0, Math.min(100, healthScore));
  probabilityOfClosing = Math.max(5, Math.min(95, probabilityOfClosing));

  let actionLabel = "Follow Up with Buyer";
  let actionType: DealHealthAnalysis["nextBestAction"]["actionType"] = "follow_up";
  const href = `/conversations/${deal.id}`;

  if (deal.stage === "inquiry" || deal.stage === "lead") {
    actionLabel = "Schedule Physical Viewing";
    actionType = "schedule_viewing";
  } else if (deal.stage === "viewing_completed") {
    actionLabel = "Request Verification & Inspection";
    actionType = "request_inspection";
  } else if (deal.stage === "offer_received") {
    actionLabel = "Review & Send Counter Offer";
    actionType = "counter_offer";
  } else if (deal.stage === "closing") {
    actionLabel = "Complete Deal & Unlock Review";
    actionType = "complete_deal";
  }

  return {
    dealId: deal.id,
    healthScore,
    probabilityOfClosing,
    momentum,
    daysInCurrentStage: deal.daysInStage,
    negotiationRisk: deal.offersCount > 3 ? "high" : "low",
    inspectionRisk: deal.hasInspection ? "low" : "medium",
    nextBestAction: {
      label: actionLabel,
      actionType,
      href,
    },
    warnings,
  };
}

/** Compute Operations Case Priority & Urgency */
export function calculateCasePriority(caseItem: {
  id: string;
  caseType: string;
  hoursElapsed: number;
  slaLimitHours?: number;
}): OperationsCasePriority {
  const slaLimit = caseItem.slaLimitHours ?? 48;
  const hoursRemaining = Math.max(0, slaLimit - caseItem.hoursElapsed);
  const slaRiskWarning = hoursRemaining <= 12;

  let priorityScore = 50;
  if (slaRiskWarning) priorityScore += 30;
  if (hoursRemaining <= 4) priorityScore += 15;

  priorityScore = Math.min(100, priorityScore);

  let urgencyLevel: OperationsCasePriority["urgencyLevel"] = "low";
  if (priorityScore >= 85) urgencyLevel = "critical";
  else if (priorityScore >= 70) urgencyLevel = "high";
  else if (priorityScore >= 50) urgencyLevel = "medium";

  let role: OperationsCasePriority["recommendedOfficerRole"] = "field_verifier";
  if (caseItem.caseType.includes("legal") || caseItem.caseType.includes("title")) {
    role = "legal_partner";
  } else if (caseItem.caseType.includes("support") || caseItem.caseType.includes("dispute")) {
    role = "customer_support";
  }

  return {
    caseId: caseItem.id,
    priorityScore,
    urgencyLevel,
    riskScore: slaRiskWarning ? 80 : 30,
    slaRemainingHours: hoursRemaining,
    slaRiskWarning,
    recommendedOfficerRole: role,
    assignmentReason: slaRiskWarning
      ? `Case approaching SLA deadline (${hoursRemaining}h remaining). Immediate assignment recommended.`
      : "Standard operational queue priority.",
  };
}
