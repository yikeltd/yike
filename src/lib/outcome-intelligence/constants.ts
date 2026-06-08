/** Internal outcome intelligence — never expose publicly */

export type OutcomeSignalType =
  | "inquiry_rate"
  | "save_count"
  | "whatsapp_clicks"
  | "low_complaints"
  | "misleading_reports"
  | "inspection_requests"
  | "successful_engagement"
  | "long_listing_quality"
  | "price_stability"
  | "ghost_reactivation"
  | "duplicate_repost"
  | "rapid_takedown"
  | "post_approval_edits"
  | "unresponsive_agent"
  | "bait_pricing_signal"
  | "admin_override_positive"
  | "admin_override_negative";

export type OutcomeEntityType = "listing" | "agent" | "area";

export const POSITIVE_SIGNALS: OutcomeSignalType[] = [
  "inquiry_rate",
  "save_count",
  "whatsapp_clicks",
  "low_complaints",
  "inspection_requests",
  "successful_engagement",
  "long_listing_quality",
  "price_stability",
  "admin_override_positive",
];

export const NEGATIVE_SIGNALS: OutcomeSignalType[] = [
  "misleading_reports",
  "ghost_reactivation",
  "duplicate_repost",
  "rapid_takedown",
  "post_approval_edits",
  "unresponsive_agent",
  "bait_pricing_signal",
  "admin_override_negative",
];

/** Max delta applied to review score from outcomes — conservative */
export const MAX_OUTCOME_EVOLUTION_DELTA = 25;
