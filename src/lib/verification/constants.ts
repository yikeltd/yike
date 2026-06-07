export const YVR_PREFIX = "YVR";

export const VERIFICATION_LEGAL_DISCLAIMER =
  "Yike provides independent property verification assistance based on physical inspection observations. This does not constitute legal ownership confirmation or legal advice.";

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
