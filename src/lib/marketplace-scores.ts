import type { Property, Profile } from "@/types/database";

/** Internal engagement signal — not shown publicly. */
export function computeEngagementScore(
  property: Pick<Property, "views_count" | "contact_clicks">
): number {
  const views = Math.min(property.views_count ?? 0, 500);
  const clicks = Math.min(property.contact_clicks ?? 0, 80);
  return Math.round(views * 0.15 + clicks * 4);
}

/** Inquiry intensity from contact actions. */
export function computeInquiryScore(
  property: Pick<Property, "contact_clicks" | "inspection_requested_count">
): number {
  const clicks = property.contact_clicks ?? 0;
  const inspections = property.inspection_requested_count ?? 0;
  return Math.round(Math.min(clicks, 50) * 3 + Math.min(inspections, 10) * 8);
}

/**
 * Composite internal quality — combines health, images, freshness.
 * Never expose in public UI.
 */
export function computeHiddenQualityScore(
  property: Pick<
    Property,
    | "listing_health_score"
    | "image_quality_score"
    | "freshness_score"
    | "confidence_score"
    | "possible_duplicate"
    | "duplicate_confidence_score"
  >
): number {
  let score = 0;
  score += (property.listing_health_score ?? 50) * 0.35;
  score += (property.image_quality_score ?? 50) * 0.25;
  score += (property.freshness_score ?? 50) * 0.2;
  score += (property.confidence_score ?? 50) * 0.2;
  if (
    property.possible_duplicate &&
    (property.duplicate_confidence_score ?? 0) >= 0.65
  ) {
    score -= 25;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function marketplaceRankAdjustments(
  property: Pick<
    Property,
    | "freshness_score"
    | "engagement_score"
    | "inquiry_score"
    | "hidden_quality_score"
    | "report_review_recommended"
    | "soft_hold_recommended"
    | "moderation_state"
    | "boost_level"
    | "boost_priority"
    | "is_boosted"
    | "boosted_until"
  >
): number {
  let delta = 0;

  if (property.freshness_score != null) {
    delta += Math.round(property.freshness_score * 6);
  }
  delta += Math.min(property.engagement_score ?? 0, 120) * 4;
  delta += Math.min(property.inquiry_score ?? 0, 100) * 5;
  if (property.hidden_quality_score != null) {
    delta += property.hidden_quality_score * 3;
  }

  if (property.report_review_recommended) delta -= 600;
  if (property.soft_hold_recommended) delta -= 1_400;
  if (property.moderation_state === "flagged") delta -= 2_000;
  if (property.moderation_state === "under_investigation") delta -= 3_500;
  if (property.moderation_state === "pending_review") delta -= 400;

  const boostActive =
    property.is_boosted &&
    (!property.boosted_until || new Date(property.boosted_until) > new Date());
  if (boostActive) {
    delta += 1_500 + (property.boost_level ?? 0) * 400;
    delta += Math.min(property.boost_priority ?? 0, 50) * 20;
  }

  return delta;
}

export function computeResponsivenessScore(
  agent: Pick<
    Profile,
    "response_rate" | "avg_response_time_minutes" | "is_responsive" | "last_activity_at"
  >
): number {
  let score = 0;
  const rate = agent.response_rate ?? 0;
  score += rate * 55;
  if (agent.is_responsive) score += 20;
  const avg = agent.avg_response_time_minutes;
  if (avg != null && avg <= 120) score += 15;
  else if (avg != null && avg <= 360) score += 8;
  if (agent.last_activity_at) {
    const days =
      (Date.now() - new Date(agent.last_activity_at).getTime()) / 86_400_000;
    if (days <= 3) score += 10;
    else if (days > 14) score -= Math.min(20, days);
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}
