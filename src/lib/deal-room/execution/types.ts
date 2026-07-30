/**
 * Yike Transaction Workspace Engine — Enterprise Execution Platform Types
 * Dedicated real-world operational execution aggregates, checklists, & personnel assignments.
 */

import type { BaseEntity, ParticipantRole } from "../types";

export type ExecutionType =
  | "vehicle_inspection"
  | "property_inspection"
  | "drone_survey"
  | "lawyer_verification"
  | "surveyor_visit"
  | "document_pickup"
  | "asset_delivery"
  | "installation"
  | "maintenance"
  | "commissioning"
  | "site_visit"
  | "remote_inspection"
  | "custom";

export type ExecutionStatus =
  | "requested"
  | "assigned"
  | "accepted"
  | "scheduled"
  | "travelling"
  | "arrived"
  | "in_progress"
  | "paused"
  | "completed"
  | "cancelled"
  | "rejected"
  | "expired";

export type ChecklistItemResult = "pass" | "fail" | "not_applicable" | "pending";

export interface ChecklistItem {
  id: string;
  label: string;
  result: ChecklistItemResult;
  notes?: string;
  evidenceId?: string;
}

export interface ChecklistGroup {
  category: string;
  items: ChecklistItem[];
}

export interface ExecutionAssignee {
  userId: string;
  role: ParticipantRole;
  status: "assigned" | "accepted" | "arrived" | "completed";
  assignedAt: string;
  arrivedAt?: string;
}

export interface ExecutionAggregate extends BaseEntity {
  workspaceId: string;
  appointmentId?: string;
  negotiationId?: string;
  executionType: ExecutionType;
  executionStatus: ExecutionStatus;
  assignees: ExecutionAssignee[];
  checklists: ChecklistGroup[];
  completionPercentage: number;
  evidenceIds: string[];
  notes?: string;
  metadata?: Record<string, unknown>;
}
