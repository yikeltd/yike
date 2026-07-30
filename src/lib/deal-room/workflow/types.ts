/**
 * Yike Transaction Workspace Engine — Enterprise Workflow Platform Types
 * Orchestration aggregates, task models, approval chains, & decision logs.
 */

import type { BaseEntity, ParticipantRole } from "../types";

export type WorkflowType =
  | "transaction_workflow"
  | "property_sale"
  | "vehicle_sale"
  | "rental"
  | "inspection_workflow"
  | "legal_workflow"
  | "compliance_workflow"
  | "settlement_workflow"
  | "enterprise_approval"
  | "custom_workflow";

export type WorkflowState =
  | "draft"
  | "pending"
  | "active"
  | "waiting"
  | "blocked"
  | "completed"
  | "cancelled"
  | "expired"
  | "archived";

export type TaskType =
  | "approval"
  | "review"
  | "upload_evidence"
  | "schedule_appointment"
  | "perform_execution"
  | "complete_checklist"
  | "verify_identity"
  | "approve_settlement"
  | "sign_document"
  | "custom";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskStatus = "pending" | "in_progress" | "completed" | "blocked";

export interface WorkflowTask {
  id: string;
  workflowId: string;
  taskType: TaskType;
  title: string;
  description?: string;
  assignedTo: string;
  assignedRole: ParticipantRole;
  priority: TaskPriority;
  dueDate?: string;
  taskStatus: TaskStatus;
  dependencies: string[]; // Task IDs that must complete first
  evidenceIds: string[];
  completedAt?: string;
}

export interface ApprovalChainStep {
  stepNumber: number;
  role: ParticipantRole;
  approverId?: string;
  status: "pending" | "approved" | "rejected";
  approvedAt?: string;
  notes?: string;
}

export interface DecisionLogEntry {
  id: string;
  action: string;
  actorId: string;
  actorRole: ParticipantRole;
  timestamp: string;
  notes?: string;
}

export interface WorkflowAggregate extends BaseEntity {
  workspaceId: string;
  workflowType: WorkflowType;
  workflowState: WorkflowState;
  tasks: WorkflowTask[];
  approvalChain: ApprovalChainStep[];
  decisionLog: DecisionLogEntry[];
  currentStepIndex: number;
  metadata?: Record<string, unknown>;
}
