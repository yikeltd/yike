export type LeadQualityLabel =
  | "serious"
  | "inspection_ready"
  | "spam"
  | "duplicate"
  | "low_intent"
  | "premium"
  | "developer_interest";

export type LeadEventType =
  | "lead_created"
  | "user_opened_whatsapp"
  | "support_replied"
  | "handoff_shared"
  | "agent_contacted"
  | "inspection_requested"
  | "archived"
  | "quality_updated"
  | "assigned"
  | "note_added"
  | "routing_decided"
  | "call_clicked"
  | "call_opened"
  | "call_allowed"
  | "call_blocked";

export type LeadEvent = {
  id: string;
  lead_id: string;
  type: LeadEventType | string;
  actor_id: string | null;
  actor_role: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type SupportQuickReply = {
  id: string;
  title: string;
  body: string;
  active: boolean;
  created_by: string | null;
  updated_at: string;
  created_at: string;
};

export type InternalProfileNote = {
  id: string;
  profile_id: string;
  note: string;
  created_by: string | null;
  visibility: string;
  created_at: string;
};

export type LeadOperationsFields = {
  lead_quality_label: LeadQualityLabel | null;
  lead_quality_score: number | null;
  archived_at: string | null;
  archived_by: string | null;
  archive_reason: string | null;
  requires_manual_review: boolean;
  premium_lead: boolean;
  assigned_support_id: string | null;
};

export const LEAD_QUALITY_LABELS: { value: LeadQualityLabel; label: string }[] = [
  { value: "serious", label: "Serious" },
  { value: "inspection_ready", label: "Inspection ready" },
  { value: "spam", label: "Spam" },
  { value: "duplicate", label: "Duplicate" },
  { value: "low_intent", label: "Low intent" },
  { value: "premium", label: "Premium" },
  { value: "developer_interest", label: "Developer interest" },
];

export const COOLDOWN_USER_MESSAGE =
  "You recently contacted this listing. Please wait a little before sending another inquiry.";
