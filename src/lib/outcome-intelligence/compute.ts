import type { OutcomeSignalType } from "./constants";
import { MAX_OUTCOME_EVOLUTION_DELTA } from "./constants";

export type ListingOutcomeInput = {
  views: number;
  contactClicks: number;
  inquiryScore: number;
  engagementScore: number;
  saveCount: number;
  openReports: number;
  misleadingReports: number;
  inspectionRequests: number;
  priceChangeCount: number;
  reactivationCount: number;
  daysLive: number;
  postApprovalEditCount: number;
  wasRapidlyHidden: boolean;
  possibleDuplicate: boolean;
  priceAnomalyLevel: string | null;
  agentResponseRate: number;
  adminPositiveOverride: boolean;
  adminNegativeOverride: boolean;
};

export type OutcomeComputation = {
  outcomeScore: number;
  evolutionDelta: number;
  positive: string[];
  negative: string[];
  signals: Partial<Record<OutcomeSignalType, number>>;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Pure computation — fast, no I/O */
export function computeListingOutcome(input: ListingOutcomeInput): OutcomeComputation {
  let score = 50;
  let delta = 0;
  const positive: string[] = [];
  const negative: string[] = [];
  const signals: Partial<Record<OutcomeSignalType, number>> = {};

  const inquiryRate =
    input.views > 20 ? input.contactClicks / input.views : 0;
  if (inquiryRate >= 0.08) {
    score += 12;
    delta += 4;
    positive.push("Strong inquiry conversion");
    signals.inquiry_rate = Math.round(inquiryRate * 100);
  } else if (input.views > 40 && inquiryRate < 0.01) {
    score -= 6;
    negative.push("Low inquiry conversion despite views");
  }

  if (input.saveCount >= 3) {
    score += 8;
    delta += 3;
    positive.push("Users saving this listing");
    signals.save_count = input.saveCount;
  }

  if (input.contactClicks >= 5) {
    score += 6;
    delta += 2;
    signals.whatsapp_clicks = input.contactClicks;
  }

  if (input.openReports === 0 && input.misleadingReports === 0) {
    score += 5;
    signals.low_complaints = 1;
  }

  if (input.misleadingReports > 0) {
    const penalty = Math.min(25, input.misleadingReports * 10);
    score -= penalty;
    delta -= Math.min(12, input.misleadingReports * 5);
    negative.push("Misleading listing reports");
    signals.misleading_reports = input.misleadingReports;
  } else if (input.openReports >= 2) {
    score -= input.openReports * 4;
    delta -= Math.min(10, input.openReports * 3);
    negative.push("Multiple user reports");
  }

  if (input.inspectionRequests >= 1) {
    score += 5;
    delta += 2;
    positive.push("Inspection interest");
    signals.inspection_requests = input.inspectionRequests;
  }

  if (input.engagementScore >= 40) {
    score += 6;
    delta += 2;
    signals.successful_engagement = input.engagementScore;
  }

  if (input.daysLive >= 30 && input.openReports === 0 && input.reactivationCount === 0) {
    score += 8;
    delta += 3;
    positive.push("Stable listing over time");
    signals.long_listing_quality = input.daysLive;
  }

  if (input.priceChangeCount <= 1) {
    score += 3;
    signals.price_stability = 1;
  } else if (input.priceChangeCount >= 4) {
    score -= 8;
    delta -= 4;
    negative.push("Frequent price changes");
    signals.bait_pricing_signal = input.priceChangeCount;
  }

  if (input.reactivationCount >= 2) {
    score -= 10;
    delta -= 6;
    negative.push("Repeated reactivation pattern");
    signals.ghost_reactivation = input.reactivationCount;
  }

  if (input.possibleDuplicate) {
    score -= 12;
    delta -= 8;
    negative.push("Duplicate repost signal");
    signals.duplicate_repost = 1;
  }

  if (input.wasRapidlyHidden) {
    score -= 15;
    delta -= 10;
    negative.push("Rapid takedown after approval");
    signals.rapid_takedown = 1;
  }

  if (input.postApprovalEditCount >= 3) {
    score -= 6;
    delta -= 4;
    negative.push("Suspicious edits after approval");
    signals.post_approval_edits = input.postApprovalEditCount;
  }

  if (input.agentResponseRate < 0.3 && input.contactClicks >= 3) {
    score -= 8;
    delta -= 5;
    negative.push("Unresponsive agent after inquiries");
    signals.unresponsive_agent = 1;
  } else if (input.agentResponseRate >= 0.7) {
    score += 4;
    delta += 2;
  }

  if (input.priceAnomalyLevel === "unusually_low") {
    score -= 8;
    delta -= 5;
    negative.push("Bait pricing signal");
    signals.bait_pricing_signal = 1;
  }

  if (input.adminPositiveOverride) {
    delta += 3;
    signals.admin_override_positive = 1;
  }
  if (input.adminNegativeOverride) {
    delta -= 5;
    signals.admin_override_negative = 1;
  }

  return {
    outcomeScore: clamp(Math.round(score), 0, 100),
    evolutionDelta: clamp(Math.round(delta), -MAX_OUTCOME_EVOLUTION_DELTA, MAX_OUTCOME_EVOLUTION_DELTA),
    positive,
    negative,
    signals,
  };
}

export function applyOutcomeToReviewScore(
  baseOverall: number,
  evolutionDelta: number
): number {
  return clamp(
    Math.round(baseOverall + evolutionDelta),
    0,
    100
  );
}

export function agentStrictnessFromQuality(qualityScore: number): number {
  if (qualityScore >= 75) return -8;
  if (qualityScore >= 60) return -4;
  if (qualityScore <= 35) return 10;
  if (qualityScore <= 50) return 5;
  return 0;
}
