/** Internal-only — never expose dangerous labels publicly */

export type InternalRiskLevel = "low" | "moderate" | "elevated" | "high" | "critical";

export type PropertyInternalTrustStatus =
  | "normal"
  | "physically_reviewed"
  | "legal_review_requested"
  | "under_investigation"
  | "suspicious"
  | "high_risk"
  | "removed";

export type TrustCaseType =
  | "property_verification"
  | "legal_verification"
  | "property"
  | "agent"
  | "company"
  | "escalation";

export type TimelineEventType =
  | "request_submitted"
  | "buyer_contacted"
  | "awaiting_documents"
  | "verifier_assigned"
  | "verifier_accepted"
  | "report_uploaded"
  | "admin_reviewed"
  | "legal_partner_assigned"
  | "legal_report_submitted"
  | "payout_approved"
  | "payout_paid"
  | "fraud_review_triggered"
  | "escalation_opened"
  | "reinspection_requested"
  | "dispute_submitted"
  | "delivered_to_buyer"
  | "case_closed"
  | "risk_assessed"
  | "payment_received"
  | "listing_held"
  | "agent_frozen";

export const SAFE_PUBLIC_WORDING = {
  verificationAssistance: "verification assistance",
  physicalInspection: "independent physical inspection",
  legalReviewAssistance: "legal review assistance",
  independentlyReviewed: "independently reviewed",
  dueDiligence: "buyer due diligence encouraged",
} as const;

export const FORBIDDEN_PUBLIC_WORDING = [
  "guaranteed",
  "certified ownership",
  "fully secure",
  "fraud-proof",
  "legally approved",
  "yike approved",
  "ownership guaranteed",
  "title guarantee",
] as const;

export const TRUST_COMMAND_TABS = [
  { id: "verification_requests", label: "Verification Requests" },
  { id: "legal_reviews", label: "Legal Reviews" },
  { id: "field_verifiers", label: "Verifiers" },
  { id: "legal_partners", label: "Legal Partners" },
  { id: "fraud_review", label: "Fraud Review" },
  { id: "escalations", label: "Escalations" },
  { id: "payout_holds", label: "Payout Holds" },
  { id: "diaspora", label: "Diaspora Requests" },
  { id: "analytics", label: "Trust Analytics" },
  { id: "trust_intelligence", label: "Trust Intelligence" },
] as const;

export const RISK_SIGNAL_LABELS: Record<string, string> = {
  suspicious_pricing: "Suspicious pricing",
  seller_history: "Suspicious seller history",
  fake_photo_reports: "Fake photo reports",
  verifier_concerns: "Verifier concerns",
  legal_concerns: "Legal concerns",
  repeated_complaints: "Repeated complaints",
  listing_removals: "Repeated listing removals",
  unusual_urgency: "Unusual urgency",
  diaspora_risk: "Diaspora sensitivity",
  fake_documents: "Fake documentation patterns",
  concern_flags: "Buyer concern flags",
  already_paid: "Buyer already paid",
  fraud_review: "Active fraud review",
};
