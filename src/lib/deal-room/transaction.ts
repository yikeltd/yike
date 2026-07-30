/**
 * Yike Transaction Workspace Engine — Business Execution Transaction Aggregate
 * Separate from collaboration workspace; manages business execution, escrow, disputes, and completion.
 */

import type { BaseEntity } from "./types";

export type TransactionExecutionStatus =
  | "draft"
  | "pending_funding"
  | "escrow_funded"
  | "inspection_approved"
  | "documents_approved"
  | "disbursed"
  | "completed"
  | "refunded"
  | "disputed"
  | "cancelled";

export type EscrowState = "unfunded" | "held" | "released" | "refunded" | "frozen";

export interface TransactionAggregate extends BaseEntity {
  transactionWorkspaceId: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: "NGN" | "USD";
  executionStatus: TransactionExecutionStatus;
  escrowState: EscrowState;
  disputeId?: string;
  refundReason?: string;
  metadata?: Record<string, unknown>;
}

export function createTransactionAggregate(
  workspaceId: string,
  listingId: string,
  buyerId: string,
  sellerId: string,
  amount: number,
  currency: "NGN" | "USD" = "NGN"
): TransactionAggregate {
  const now = new Date().toISOString();
  return {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    transactionWorkspaceId: workspaceId,
    listingId,
    buyerId,
    sellerId,
    amount,
    currency,
    executionStatus: "draft",
    escrowState: "unfunded",
    createdBy: buyerId,
    createdAt: now,
    updatedAt: now,
    version: 1,
    status: "active",
  };
}
