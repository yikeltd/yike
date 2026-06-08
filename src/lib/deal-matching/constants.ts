export const DEAL_REQUEST_TYPES = [
  "rent_request",
  "buy_request",
  "land_request",
  "commercial_request",
  "office_request",
  "relocation_request",
  "premium_request",
] as const;

export type DealRequestType = (typeof DEAL_REQUEST_TYPES)[number];

export const DEAL_REQUEST_SOURCES = [
  "user_search_behavior",
  "user_submission",
  "whatsapp_request",
  "admin_manual",
  "relocation_assistance",
  "diaspora_request",
  "property_verification_followup",
] as const;

export type DealRequestSource = (typeof DEAL_REQUEST_SOURCES)[number];

export const DEAL_STATUSES = [
  "created",
  "outreach_sent",
  "agent_responded",
  "buyer_contacted",
  "negotiation_started",
  "verification_requested",
  "legal_review_requested",
  "closed_successfully",
  "failed",
  "abandoned",
] as const;

export type DealMatchStatus = (typeof DEAL_STATUSES)[number];

export const DEAL_URGENCY_LEVELS = ["low", "normal", "high", "urgent"] as const;

export const OUTREACH_RECIPIENT_TYPES = ["agent", "company", "user"] as const;
export type OutreachRecipientType = (typeof OUTREACH_RECIPIENT_TYPES)[number];

export const OUTREACH_STATUSES = ["pending", "sent", "responded", "declined", "excluded"] as const;

export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];

export const COMMISSION_STATUSES = [
  "pending",
  "estimated",
  "agreed",
  "invoiced",
  "paid",
  "waived",
] as const;

export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];

export const PAYMENT_STATUSES = ["none", "pending", "partial", "paid", "refunded"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const DEAL_REQUEST_TYPE_LABELS: Record<DealRequestType, string> = {
  rent_request: "Rent",
  buy_request: "Buy",
  land_request: "Land",
  commercial_request: "Commercial",
  office_request: "Office",
  relocation_request: "Relocation",
  premium_request: "Premium",
};

export const DEAL_SOURCE_LABELS: Record<DealRequestSource, string> = {
  user_search_behavior: "Search behavior",
  user_submission: "User submission",
  whatsapp_request: "WhatsApp request",
  admin_manual: "Admin manual",
  relocation_assistance: "Relocation assistance",
  diaspora_request: "Diaspora request",
  property_verification_followup: "Verification follow-up",
};

export const DEAL_STATUS_LABELS: Record<DealMatchStatus, string> = {
  created: "Created",
  outreach_sent: "Outreach sent",
  agent_responded: "Agent responded",
  buyer_contacted: "Buyer contacted",
  negotiation_started: "Negotiation",
  verification_requested: "Verification requested",
  legal_review_requested: "Legal review",
  closed_successfully: "Closed successfully",
  failed: "Failed",
  abandoned: "Abandoned",
};

export const MAX_OUTREACH_RECIPIENTS = 25;
