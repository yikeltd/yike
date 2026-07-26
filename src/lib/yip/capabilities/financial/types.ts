/**
 * Financial Platform — shared domain types.
 * One capability, many modules. Ledger is append-only source of truth.
 */

export type MoneyAmount = {
  amount: number;
  currency: string;
};

export type FinancialTransactionStatus =
  | "pending"
  | "authorized"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired"
  | "refunded"
  | "reversed";

export type LedgerEntryType =
  | "payment"
  | "refund"
  | "commission"
  | "wallet_credit"
  | "wallet_debit"
  | "settlement"
  | "promotion_credit"
  | "subscription"
  | "adjustment"
  | "reserve"
  | "release";

export type LedgerEntry = {
  id: string;
  type: LedgerEntryType;
  accountId: string;
  amount: number;
  currency: string;
  /** Credits positive, debits negative — double-entry companion via correlating entry. */
  direction: "credit" | "debit";
  reference: string;
  correlationId: string;
  capability: string;
  provider?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type FinancialAuditRecord = {
  timestamp: string;
  actorId: string | null;
  capability: string;
  provider: string | null;
  amount: number | null;
  currency: string | null;
  status: string;
  reference: string;
  correlationId: string;
  riskScore?: number | null;
  metadata?: Record<string, unknown>;
};

export type ModuleHealth = {
  id: string;
  label: string;
  status: "healthy" | "warning" | "critical" | "disabled";
  detail: string;
  enabled: boolean;
  latencyMs?: number;
};

export type FinancialHealth = {
  overall: "healthy" | "warning" | "critical" | "disabled";
  modules: ModuleHealth[];
  flags: Record<string, boolean>;
  checkedAt: string;
};
