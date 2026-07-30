export type TrustStatus =
  | "trusted"
  | "verified"
  | "normal"
  | "under_review"
  | "restricted"
  | "suspended"
  | "banned";

export type ReportCategory =
  | "scam"
  | "fraud"
  | "fake_listing"
  | "fake_vehicle"
  | "fake_property"
  | "misleading_information"
  | "harassment"
  | "spam"
  | "impersonation"
  | "counterfeit_documents"
  | "inappropriate_content"
  | "payment_fraud"
  | "other";

export type ReportStatus = "pending" | "under_review" | "resolved" | "dismissed" | "merged";

export interface TrustProfile {
  id: string;
  user_id: string;
  trust_status: TrustStatus;
  risk_score: number;
  trust_score: number;
  verification_score: number;
  identity_status: string;
  report_count: number;
  confirmed_violations: number;
  dismissed_reports: number;
  warnings_issued: number;
  restrictions_count: number;
  suspensions_count: number;
  permanent_ban_flag: boolean;
  appeal_status: string;
  last_reviewed_at: string | null;
  last_reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrustLedgerEntry {
  id: string;
  user_id: string;
  event_type: string;
  actor_id: string | null;
  title: string;
  description: string | null;
  risk_score_delta: number;
  trust_score_delta: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface UserReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reported_listing_id: string | null;
  reported_conversation_id: string | null;
  category: ReportCategory;
  description: string;
  evidence: Array<{
    type: "image" | "document" | "screenshot" | "conversation_ref" | "listing_ref";
    url?: string;
    note?: string;
  }>;
  status: ReportStatus;
  assigned_moderator_id: string | null;
  resolution: string | null;
  created_at: string;
  updated_at: string;
}
