/**
 * Yike Transaction Workspace Engine — Enterprise Settlement Platform Types
 * Dedicated financial settlement aggregates, double-entry ledger models, & split allocations.
 */

import type { BaseEntity, ParticipantRole } from "../types";

export type SettlementType =
  | "escrow"
  | "marketplace_payment"
  | "wallet_transfer"
  | "refund"
  | "partial_refund"
  | "milestone_release"
  | "inspection_fee"
  | "legal_fee"
  | "commission"
  | "platform_fee"
  | "tax"
  | "bank_transfer"
  | "custom";

export type SettlementStatus =
  | "draft"
  | "pending"
  | "authorized"
  | "held"
  | "processing"
  | "partially_released"
  | "released"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded"
  | "expired";

export interface LedgerEntry {
  id: string;
  settlementId: string;
  accountId: string;
  accountType: "buyer" | "seller" | "agent" | "platform" | "escrow_hold" | "tax";
  entryType: "debit" | "credit";
  amount: number;
  currency: "NGN" | "USD";
  timestamp: string;
  referenceHash: string;
}

export interface SettlementSplit {
  recipientId: string;
  role: ParticipantRole;
  amount: number;
  percentage: number;
  purpose: string;
}

export interface ReleaseConditionCheck {
  condition: string;
  met: boolean;
  notes: string;
}

export interface SettlementAggregate extends BaseEntity {
  workspaceId: string;
  settlementType: SettlementType;
  settlementStatus: SettlementStatus;
  totalAmount: number;
  currency: "NGN" | "USD";
  escrowHold: boolean;
  ledgerEntries: LedgerEntry[];
  splits: SettlementSplit[];
  releaseConditions: ReleaseConditionCheck[];
  providerId: string;
  metadata?: Record<string, unknown>;
}
