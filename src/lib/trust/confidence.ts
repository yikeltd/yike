import type { Property } from "@/types/database";
import { isVerifiedAgentProfile } from "@/lib/agent-tiers";
import { isRecentlyUpdated } from "@/lib/trust/quality";

/** Internal listing confidence — never expose raw score publicly. */
export function computeListingConfidence(property: Property): number {
  let score = 40;

  const agent = property.agent;
  if (agent && isVerifiedAgentProfile(agent)) score += 12;
  if (property.yike_verified) score += 10;
  if (property.is_verified_listing) score += 5;

  if (property.listing_health_score != null) {
    score += Math.round(property.listing_health_score * 0.25);
  }

  if (property.freshness_score != null) {
    score += Math.round(property.freshness_score * 0.15);
  } else if (isRecentlyUpdated(property)) {
    score += 8;
  }

  if ((property.contact_clicks ?? 0) >= 3) score += 5;
  if ((property.views_count ?? 0) >= 15) score += 3;

  if (property.yike_inspection_eligible) score += 4;

  if (agent?.performance_score != null) {
    score += Math.min(10, Math.round(agent.performance_score * 0.1));
  }
  if (agent?.reputation_score != null) {
    score += Math.min(8, Math.round(Number(agent.reputation_score) * 0.08));
  }

  if (
    property.possible_duplicate &&
    (property.duplicate_confidence_score ?? 0) >= 0.65
  ) {
    score -= 20;
  }

  if (property.listing_activity_status === "stale") score -= 8;
  if (property.listing_activity_status === "inactive") score -= 18;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function listingConfidenceRankAdjustment(
  property: Pick<Property, "confidence_score" | "hot_listing" | "yike_verified">
): number {
  let delta = 0;
  if (property.confidence_score != null) {
    delta += property.confidence_score * 6;
  }
  if (property.yike_verified) delta += 700;
  if (property.hot_listing) delta += 350;
  return delta;
}
