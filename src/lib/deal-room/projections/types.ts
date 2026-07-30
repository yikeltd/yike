/**
 * Yike BTOS — CQRS Materialized Read Model Types (Milestone 4)
 * High-performance, pre-aggregated read models for dashboards & UI summaries.
 */

export interface WorkspaceSummaryProjection {
  workspaceId: string;
  listingId: string;
  listingTitle: string;
  stage: string;
  trustScore: number;
  escrowBalance: number;
  currency: string;
  activeTaskCount: number;
  completedTaskCount: number;
  lifecycleStatus: string;
  disputeOpen: boolean;
  lastEventTitle: string;
  lastEventAt: string;
}

export interface SettlementDashboardProjection {
  workspaceId: string;
  totalEscrowAmount: number;
  currency: string;
  settlementStatus: string;
  splits: Array<{ recipientRole: string; percentage: number; amount: number }>;
  rulesMet: number;
  rulesTotal: number;
  ledgerEntriesCount: number;
  lastLedgerTimestamp: string;
}

export interface TrustDashboardProjection {
  workspaceId: string;
  factualTrustScore: number;
  reputationScore: number;
  verificationsCount: number;
  verifiedTitle: boolean;
  verifiedKYC: boolean;
  fieldInspectionPassed: boolean;
}

export interface WorkflowDashboardProjection {
  workspaceId: string;
  workflowState: string;
  currentStepIndex: number;
  totalSteps: number;
  pendingApprovals: number;
  tasks: Array<{ taskId: string; title: string; status: string; role: string }>;
}
