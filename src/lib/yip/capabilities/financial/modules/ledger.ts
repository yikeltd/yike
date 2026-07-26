/**
 * Append-only ledger module — source of truth for financial events.
 * In-process ring buffer for certification; DB-backed immutable table is next migration.
 */
import { randomUUID } from "crypto";
import type { LedgerEntry, LedgerEntryType, ModuleHealth } from "../types";

const MAX_MEMORY_ENTRIES = 5_000;
const entries: LedgerEntry[] = [];

export type LedgerModule = {
  append: (
    input: Omit<LedgerEntry, "id" | "createdAt"> & { id?: string; createdAt?: string }
  ) => LedgerEntry;
  listByAccount: (accountId: string, limit?: number) => LedgerEntry[];
  listByReference: (reference: string) => LedgerEntry[];
  recordPair: (input: {
    type: LedgerEntryType;
    accountId: string;
    amount: number;
    currency: string;
    reference: string;
    correlationId: string;
    capability: string;
    provider?: string | null;
    metadata?: Record<string, unknown>;
  }) => { credit: LedgerEntry; debit: LedgerEntry };
  health: () => ModuleHealth;
};

function push(entry: LedgerEntry): LedgerEntry {
  entries.push(entry);
  if (entries.length > MAX_MEMORY_ENTRIES) {
    entries.splice(0, entries.length - MAX_MEMORY_ENTRIES);
  }
  return entry;
}

export function createLedgerModule(): LedgerModule {
  return {
    append: (input) =>
      push({
        id: input.id ?? randomUUID(),
        createdAt: input.createdAt ?? new Date().toISOString(),
        type: input.type,
        accountId: input.accountId,
        amount: input.amount,
        currency: input.currency,
        direction: input.direction,
        reference: input.reference,
        correlationId: input.correlationId,
        capability: input.capability,
        provider: input.provider ?? null,
        metadata: input.metadata,
      }),
    listByAccount: (accountId, limit = 50) =>
      entries.filter((e) => e.accountId === accountId).slice(-limit),
    listByReference: (reference) => entries.filter((e) => e.reference === reference),
    recordPair: (input) => {
      const correlationId = input.correlationId;
      const credit = push({
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        type: input.type,
        accountId: input.accountId,
        amount: Math.abs(input.amount),
        currency: input.currency,
        direction: "credit",
        reference: input.reference,
        correlationId,
        capability: input.capability,
        provider: input.provider ?? null,
        metadata: input.metadata,
      });
      const debit = push({
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        type: input.type,
        accountId: "platform:clearing",
        amount: Math.abs(input.amount),
        currency: input.currency,
        direction: "debit",
        reference: input.reference,
        correlationId,
        capability: input.capability,
        provider: input.provider ?? null,
        metadata: input.metadata,
      });
      return { credit, debit };
    },
    health: () => ({
      id: "ledger",
      label: "Ledger",
      status: "healthy",
      detail: `Append-only · ${entries.length} in-memory entries (DB migration pending)`,
      enabled: true,
    }),
  };
}

/** Test helper — clear in-memory ledger. */
export function __resetLedgerForTests(): void {
  entries.length = 0;
}
