/**
 * Case Management Domain — Types & Models (Phase 1.2)
 *
 * Provides a generic operational backbone for all Trust & Operations services.
 */

export type CaseType =
  | "PROPERTY_INSPECTION"
  | "VEHICLE_INSPECTION"
  | "LEGAL_TITLE_CHECK"
  | "BUYER_ASSISTANCE"
  | "IDENTITY_VERIFICATION"
  | "BUSINESS_VERIFICATION"
  | "FRAUD_INVESTIGATION"
  | "GENERAL_SUPPORT";

export type CaseStatus =
  | "NEW"
  | "PENDING_ASSIGNMENT"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "WAITING_CUSTOMER"
  | "COMPLETED"
  | "CANCELLED"
  | "REOPENED";

export type CasePriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type AssignedTeam =
  | "FIELD_INSPECTION"
  | "LEGAL_SERVICES"
  | "BUYER_CONCIERGE"
  | "VERIFICATION_OPS"
  | "TRUST_SAFETY"
  | "CUSTOMER_SUPPORT";

export type OfficerRole =
  | "inspector"
  | "lawyer"
  | "verifier"
  | "concierge"
  | "support_agent"
  | "ops_manager"
  | "admin";

export type CaseTimelineEventType =
  | "case_created"
  | "case_assigned"
  | "case_started"
  | "note_added"
  | "customer_updated"
  | "status_changed"
  | "priority_changed"
  | "case_completed"
  | "case_cancelled"
  | "case_reopened";

export type CaseTimelineEvent = {
  id: string;
  caseId: string;
  eventType: CaseTimelineEventType;
  actorId: string;
  actorName: string;
  title: string;
  description?: string;
  internalOnly: boolean;
  createdAt: string;
};

export type AssignmentRecord = {
  id: string;
  caseId: string;
  assignedTeam: AssignedTeam;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  assignedBy: string;
  assignmentMethod: "manual" | "auto" | "queue" | "round_robin";
  assignedAt: string;
};

export type CaseNote = {
  id: string;
  caseId: string;
  authorId: string;
  authorName: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
};

export type Case = {
  id: string;
  caseType: CaseType;
  conversationId?: string | null;
  listingId?: string | null;
  buyerId?: string | null;
  sellerId?: string | null;
  title: string;
  description?: string;
  priority: CasePriority;
  status: CaseStatus;
  assignedTeam: AssignedTeam;
  assignedOfficerId?: string | null;
  assignedOfficerName?: string | null;
  assignmentHistory: AssignmentRecord[];
  internalNotes: CaseNote[];
  timeline: CaseTimelineEvent[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
};

export type OperationalMetrics = {
  casesCreated: number;
  casesCompleted: number;
  avgResolutionTimeMinutes: number;
  avgAssignmentTimeMinutes: number;
  reassignmentRate: number;
  completionRate: number;
};
