import type { Property } from "@/types/database";
import { computeListingQualityScore } from "@/lib/listing-quality";

export type QualityLevel = "low" | "medium" | "high" | "premium";

export function qualityLevelFromScore(score: number): QualityLevel {
  if (score >= 82) return "premium";
  if (score >= 65) return "high";
  if (score >= 42) return "medium";
  return "low";
}

export function computeListingQualityBundle(property: Property): {
  quality_score: number;
  quality_level: QualityLevel;
} {
  let score = computeListingQualityScore(property);
  score += Math.min(property.image_quality_score ?? 0, 100) * 0.15;
  score += Math.min(property.freshness_score ?? 50, 100) * 0.1;
  score += Math.min(property.listing_health_score ?? 50, 100) * 0.1;
  if (property.is_verified_listing) score += 8;
  if (property.yike_verified) score += 6;
  score = Math.max(0, Math.min(100, Math.round(score)));
  return {
    quality_score: score,
    quality_level: qualityLevelFromScore(score),
  };
}

export function computeFraudRiskScore(
  property: Pick<
    Property,
    | "possible_duplicate"
    | "duplicate_confidence_score"
    | "price_anomaly_level"
    | "price_review_status"
    | "report_review_recommended"
    | "soft_hold_recommended"
    | "moderation_state"
  >
): number {
  let risk = 0;
  if (property.possible_duplicate && (property.duplicate_confidence_score ?? 0) >= 0.65) {
    risk += 25;
  }
  if (property.price_anomaly_level === "unusually_low") risk += 30;
  if (property.price_anomaly_level === "unusually_high") risk += 15;
  if (property.price_review_status === "admin_review") risk += 12;
  if (property.report_review_recommended) risk += 20;
  if (property.soft_hold_recommended) risk += 25;
  if (property.moderation_state === "flagged") risk += 20;
  if (property.moderation_state === "under_investigation") risk += 35;
  return Math.min(100, risk);
}

export function buildModerationFlags(
  property: Pick<
    Property,
    | "possible_duplicate"
    | "price_anomaly_level"
    | "price_review_status"
    | "report_review_recommended"
    | "image_quality_flags"
  >
): string[] {
  const flags: string[] = [];
  if (property.possible_duplicate) flags.push("possible_duplicate");
  if (
    property.price_anomaly_level &&
    ["unusually_high", "unusually_low", "high"].includes(property.price_anomaly_level)
  ) {
    flags.push("price_anomaly");
  }
  if (property.price_review_status === "admin_review") flags.push("price_admin_review");
  if (property.report_review_recommended) flags.push("reports_threshold");
  const imgFlags = property.image_quality_flags ?? [];
  if (imgFlags.includes("few_images")) flags.push("few_images");
  if (imgFlags.includes("low_resolution_hint") || imgFlags.includes("watermark_hint")) {
    flags.push("image_quality");
  }
  return flags;
}
