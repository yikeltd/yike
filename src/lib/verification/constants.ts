export const YVR_PREFIX = "YVR";

export {
  VERIFICATION_LEGAL_DISCLAIMER,
  VERIFICATION_LEGAL_DISCLAIMER_SHORT,
} from "@/lib/copy/user-messages";

export type VerificationPriority = "low" | "normal" | "high" | "urgent";

export type PropertyVerificationStatus =
  | "submitted"
  | "contacted"
  | "under_review"
  | "awaiting_assignment"
  | "assigned"
  | "accepted"
  | "in_progress"
  | "completed"
  | "reviewed"
  | "delivered"
  | "closed"
  | "fraud_review"
  | "rejected"
  | "cancelled"
  | "pending";

export const VERIFICATION_NEED_OPTIONS = [
  { id: "confirm_exists", label: "Confirm property exists" },
  { id: "confirm_availability", label: "Confirm property availability" },
  { id: "confirm_photos", label: "Confirm pictures match" },
  { id: "confirm_neighborhood", label: "Confirm neighborhood" },
  { id: "confirm_road_access", label: "Confirm road access" },
  { id: "confirm_occupancy", label: "Confirm occupancy condition" },
  { id: "ask_locally", label: "Ask around locally" },
  { id: "verify_agent", label: "Verify agent presence" },
  { id: "additional_observations", label: "Additional observations" },
] as const;

export const CONCERN_FLAG_OPTIONS = [
  { id: "scam_worry", label: "Worried about scam" },
  { id: "outside_nigeria", label: "Outside Nigeria" },
  { id: "cannot_inspect", label: "Unable to inspect physically" },
  { id: "already_paid", label: "Already sent money" },
  { id: "urgent_relocation", label: "Urgent relocation" },
  { id: "land_ownership", label: "Land ownership concern" },
  { id: "fake_pictures", label: "Fake picture concern" },
] as const;

export const OCCUPANCY_OPTIONS = [
  "vacant",
  "occupied",
  "under_construction",
  "abandoned",
  "inaccessible",
  "suspicious",
  "unavailable",
  "unclear",
] as const;

export const PHOTO_CHECKLIST_ITEMS = [
  { id: "exterior", label: "Property exterior" },
  { id: "street", label: "Road / street view" },
  { id: "environment", label: "Surrounding environment" },
  { id: "entrance", label: "Entrance / gate" },
  { id: "rooms", label: "Room sample(s)" },
  { id: "compound", label: "Compound" },
  { id: "landmarks", label: "Nearby landmarks" },
] as const;

export const ADMIN_QUEUE_TABS = [
  { id: "submitted", label: "New Requests", statuses: ["submitted", "pending"] },
  { id: "contacted", label: "Contacted", statuses: ["contacted"] },
  { id: "awaiting", label: "Awaiting Assignment", statuses: ["under_review", "awaiting_assignment"] },
  { id: "assigned", label: "Assigned", statuses: ["assigned"] },
  { id: "in_progress", label: "In Progress", statuses: ["accepted", "in_progress"] },
  { id: "completed", label: "Completed", statuses: ["completed"] },
  { id: "reviewed", label: "Reviewed", statuses: ["reviewed"] },
  { id: "delivered", label: "Delivered", statuses: ["delivered"] },
  { id: "closed", label: "Closed", statuses: ["closed", "rejected", "cancelled"] },
  { id: "fraud", label: "Fraud Review", statuses: ["fraud_review"] },
] as const;

/** Phased adaptive trust levels — 0 (lowest friction) through 5 (restricted). */

export type AdaptiveTrustLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const TRUST_LEVEL_LABELS: Record<AdaptiveTrustLevel, string> = {
  0: "Basic account",
  1: "Verified contact",
  2: "Listing account",
  3: "Verified agent / company",
  4: "Enhanced review",
  5: "Restricted operations",
};

export const TRUST_LEVEL_SHORT: Record<AdaptiveTrustLevel, string> = {
  0: "L0",
  1: "L1",
  2: "L2",
  3: "L3",
  4: "L4",
  5: "L5",
};

/** Future-ready public trust tiers mapped from level 3+. */
export const PREMIUM_TRUST_TIERS = [
  "basic",
  "verified",
  "trusted",
  "premium_verified",
  "enterprise_verified",
] as const;

export type PremiumTrustTier = (typeof PREMIUM_TRUST_TIERS)[number];

export {
  TRUST_SETUP_TITLE as VERIFICATION_REQUIRED_MESSAGE,
  TRUST_SETUP_SUBTEXT as VERIFICATION_REQUIRED_SUBTEXT,
  VERIFICATION_LISTING_GATE_MESSAGE,
} from "@/lib/copy/user-messages";

export type TrustReviewCaseType =
  | "escalated_user"
  | "suspicious_listing"
  | "complaint_pattern"
  | "multi_account"
  | "failed_verification"
  | "suspicious_pricing"
  | "duplicate_media"
  | "device_anomaly"
  | "manual";

export type TrustReviewAction =
  | "approve"
  | "request_verification"
  | "reduce_restrictions"
  | "escalate"
  | "require_whatsapp_review"
  | "require_bank_verification"
  | "pause_listings"
  | "restore_trust"
  | "suspend_temporary"
  | "ban_permanent"
  | "dismiss";

export const TRUST_REVIEW_ACTION_LABELS: Record<TrustReviewAction, string> = {
  approve: "Approve",
  request_verification: "Request additional verification",
  reduce_restrictions: "Reduce restrictions",
  escalate: "Escalate restrictions",
  require_whatsapp_review: "Require WhatsApp review",
  require_bank_verification: "Require bank verification",
  pause_listings: "Pause listings",
  restore_trust: "Restore account trust",
  suspend_temporary: "Suspend temporarily",
  ban_permanent: "Ban permanently",
  dismiss: "Dismiss case",
};
