/**
 * Yike Transaction Workspace Engine — Transaction Lifecycle Platform Types
 * Final completion states, immutable reviews, reputation scores, disputes, & warranties.
 */

import type { BaseEntity, ParticipantRole } from "../types";

export type LifecycleState =
  | "pending_completion"
  | "awaiting_acceptance"
  | "accepted"
  | "completed"
  | "under_warranty"
  | "disputed"
  | "refund_pending"
  | "refunded"
  | "cancelled"
  | "archived";

export interface ReviewVersion {
  versionNumber: number;
  rating: number;
  reviewText: string;
  createdAt: string;
}

export interface ReviewRecord extends BaseEntity {
  workspaceId: string;
  reviewerId: string;
  reviewerRole: ParticipantRole;
  targetId: string;
  targetRole: ParticipantRole;
  rating: number; // 1 to 5
  reviewText: string;
  currentVersionNumber: number;
  versions: ReviewVersion[];
}

export interface ReputationScore {
  userId: string;
  overallReputation: number; // 0 to 100
  transactionCount: number;
  verifiedTransactions: number;
  reviewerCredibilityScore: number;
  lastUpdated: string;
}

export interface DisputeRecord extends BaseEntity {
  workspaceId: string;
  initiatorId: string;
  initiatorRole: ParticipantRole;
  reason: string;
  disputeStatus: "open" | "evidence_submitted" | "in_mediation" | "resolved" | "appealed" | "closed";
  evidenceIds: string[];
  mediatorNotes?: string;
  resolutionOutcome?: string;
  resolvedAt?: string;
}

export interface WarrantyClaim {
  claimId: string;
  reason: string;
  claimStatus: "open" | "approved" | "rejected";
  filedAt: string;
  resolvedAt?: string;
}

export interface WarrantyRecord extends BaseEntity {
  workspaceId: string;
  assetId: string;
  durationDays: number;
  startDate: string;
  expiresAt: string;
  warrantyStatus: "active" | "claimed" | "expired";
  claims: WarrantyClaim[];
}

export interface TransactionLifecycleAggregate extends BaseEntity {
  workspaceId: string;
  lifecycleState: LifecycleState;
  buyerAccepted: boolean;
  sellerAccepted: boolean;
  buyerAcceptedAt?: string;
  sellerAcceptedAt?: string;
  reviews: ReviewRecord[];
  dispute?: DisputeRecord;
  warranty?: WarrantyRecord;
  archivedAt?: string;
  metadata?: Record<string, unknown>;
}
