import { randomUUID } from "crypto";
import type { FinancialTransactionStatus, ModuleHealth } from "../types";
import { isPaymentsEnabled } from "../flags";

export type FinancialTransaction = {
  id: string;
  status: FinancialTransactionStatus;
  amount: number;
  currency: string;
  reference: string;
  correlationId: string;
  module: string;
  createdAt: string;
  updatedAt: string;
};

const txns = new Map<string, FinancialTransaction>();

export type TransactionModule = {
  create: (input: {
    amount: number;
    currency: string;
    reference: string;
    module: string;
    correlationId?: string;
  }) => FinancialTransaction;
  transition: (
    id: string,
    status: FinancialTransactionStatus
  ) => FinancialTransaction | null;
  get: (id: string) => FinancialTransaction | null;
  getByReference: (reference: string) => FinancialTransaction | null;
  health: () => ModuleHealth;
};

export function createTransactionModule(): TransactionModule {
  return {
    create: (input) => {
      const now = new Date().toISOString();
      const tx: FinancialTransaction = {
        id: randomUUID(),
        status: "pending",
        amount: input.amount,
        currency: input.currency,
        reference: input.reference,
        correlationId: input.correlationId ?? randomUUID(),
        module: input.module,
        createdAt: now,
        updatedAt: now,
      };
      txns.set(tx.id, tx);
      return tx;
    },
    transition: (id, status) => {
      const tx = txns.get(id);
      if (!tx) return null;
      const next = { ...tx, status, updatedAt: new Date().toISOString() };
      txns.set(id, next);
      return next;
    },
    get: (id) => txns.get(id) ?? null,
    getByReference: (reference) =>
      [...txns.values()].find((t) => t.reference === reference) ?? null,
    health: () => ({
      id: "transaction",
      label: "Transaction",
      status: isPaymentsEnabled() || txns.size >= 0 ? "healthy" : "disabled",
      detail: `Lifecycle engine · ${txns.size} tracked`,
      enabled: true,
    }),
  };
}

export function __resetTransactionsForTests(): void {
  txns.clear();
}
