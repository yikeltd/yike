/** Internal trust score engine — never expose publicly */

export type TrustEntityType =
  | "agent"
  | "company"
  | "listing"
  | "field_verifier"
  | "legal_partner"
  | "service_provider";

export type TrustLevel =
  | "critical_risk"
  | "high_risk"
  | "elevated_risk"
  | "neutral"
  | "trusted"
  | "highly_trusted"
  | "elite";

export type TrustEventType =
  | "inquiry_ignored"
  | "inquiry_responded"
  | "listing_verified"
  | "complaint_received"
  | "complaint_resolved"
  | "verification_completed"
  | "verification_failed"
  | "suspicious_report"
  | "stale_listing"
  | "listing_reactivated"
  | "successful_engagement"
  | "admin_warning"
  | "fraud_flag"
  | "quality_photos"
  | "recently_active"
  | "responsive_agent"
  | "batch_recalc"
  | "admin_override"
  | "score_frozen"
  | "score_reset"
  | "manual_trusted";

export const DEFAULT_TRUST_SCORE = 50;
export const DEFAULT_RISK_SCORE = 0;

/** Conservative event deltas — tunable via events table audit trail */
export const TRUST_EVENT_DELTAS: Partial<
  Record<
    TrustEventType,
    { score_delta: number; risk_delta: number; confidence_delta: number }
  >
> = {
  inquiry_ignored: { score_delta: -2, risk_delta: 3, confidence_delta: 1 },
  inquiry_responded: { score_delta: 2, risk_delta: -1, confidence_delta: 2 },
  listing_verified: { score_delta: 3, risk_delta: -2, confidence_delta: 3 },
  complaint_received: { score_delta: -5, risk_delta: 8, confidence_delta: 2 },
  complaint_resolved: { score_delta: 2, risk_delta: -3, confidence_delta: 1 },
  verification_completed: { score_delta: 4, risk_delta: -3, confidence_delta: 4 },
  verification_failed: { score_delta: -4, risk_delta: 7, confidence_delta: 3 },
  suspicious_report: { score_delta: -3, risk_delta: 6, confidence_delta: 2 },
  stale_listing: { score_delta: -3, risk_delta: 2, confidence_delta: 1 },
  listing_reactivated: { score_delta: 1, risk_delta: 0, confidence_delta: 1 },
  successful_engagement: { score_delta: 2, risk_delta: -1, confidence_delta: 2 },
  admin_warning: { score_delta: -4, risk_delta: 5, confidence_delta: 2 },
  fraud_flag: { score_delta: -10, risk_delta: 15, confidence_delta: 4 },
  quality_photos: { score_delta: 2, risk_delta: -1, confidence_delta: 2 },
  recently_active: { score_delta: 3, risk_delta: -1, confidence_delta: 2 },
  responsive_agent: { score_delta: 2, risk_delta: -2, confidence_delta: 2 },
};

export const TRUST_LEVEL_LABELS: Record<TrustLevel, string> = {
  critical_risk: "Critical risk",
  high_risk: "High risk",
  elevated_risk: "Elevated risk",
  neutral: "Neutral",
  trusted: "Trusted",
  highly_trusted: "Highly trusted",
  elite: "Elite",
};
