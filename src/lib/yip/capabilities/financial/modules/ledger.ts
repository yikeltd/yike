/**
 * Append-only ledger module — source of truth for financial events.
 * Memory buffer for local/tests; durable writes via financial_ledger_entries.
 */
import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LedgerEntry, LedgerEntryType, ModuleHealth } from "../types";
import {
  countLedgerEntries,
  fetchLedgerByAccount,
  fetchLedgerByReference,
  persistLedgerEntries,
} from "./ledger-store";

const MAX_MEMORY_ENTRIES = 5_000;
const entries: LedgerEntry[] = [];

export type LedgerRecordPairInput = {
  type: LedgerEntryType;
  accountId: string;
  amount: number;
  currency: string;
  reference: string;
  correlationId: string;
  capability: string;
  provider?: string | null;
  metadata?: Record<string, unknown>;
  paymentOrderId?: string | null;
  /** When set, also persist to financial_ledger_entries (service role). */
  admin?: SupabaseClient | null;
};

export type LedgerModule = {
  append: (
    input: Omit<LedgerEntry, "id" | "createdAt"> & { id?: string; createdAt?: string }
  ) => LedgerEntry;
  listByAccount: (accountId: string, limit?: number) => LedgerEntry[];
  listByReference: (reference: string) => LedgerEntry[];
  recordPair: (input: LedgerRecordPairInput) => Promise<{
    credit: LedgerEntry;
    debit: LedgerEntry;
    persisted: boolean;
  }>;
  listByAccountDurable: (
    admin: SupabaseClient,
    accountId: string,
    limit?: number
  ) => Promise<LedgerEntry[]>;
  listByReferenceDurable: (
    admin: SupabaseClient,
    reference: string
  ) => Promise<LedgerEntry[]>;
  health: () => ModuleHealth;
  healthAsync: (admin?: SupabaseClient | null) => Promise<ModuleHealth>;
};

function push(entry: LedgerEntry): LedgerEntry {
  entries.push(entry);
  if (entries.length > MAX_MEMORY_ENTRIES) {
    entries.splice(0, entries.length - MAX_MEMORY_ENTRIES);
  }
  return entry;
}

function makePair(input: LedgerRecordPairInput): {
  credit: LedgerEntry;
  debit: LedgerEntry;
} {
  const correlationId = input.correlationId || randomUUID();
  // Postgres column is UUID — normalize non-UUID test IDs
  const correlationUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      correlationId
    )
      ? correlationId
      : randomUUID();
  const now = new Date().toISOString();
  const credit = push({
    id: randomUUID(),
    createdAt: now,
    type: input.type,
    accountId: input.accountId,
    amount: Math.abs(input.amount),
    currency: input.currency,
    direction: "credit",
    reference: input.reference,
    correlationId: correlationUuid,
    capability: input.capability,
    provider: input.provider ?? null,
    metadata: input.metadata,
  });
  const debit = push({
    id: randomUUID(),
    createdAt: now,
    type: input.type,
    accountId: "platform:clearing",
    amount: Math.abs(input.amount),
    currency: input.currency,
    direction: "debit",
    reference: input.reference,
    correlationId: correlationUuid,
    capability: input.capability,
    provider: input.provider ?? null,
    metadata: input.metadata,
  });
  return { credit, debit };
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
    recordPair: async (input) => {
      const pair = makePair(input);
      let persisted = false;
      if (input.admin) {
        const result = await persistLedgerEntries(input.admin, [pair.credit, pair.debit], {
          paymentOrderId: input.paymentOrderId,
        });
        persisted = result.ok;
      }
      return { ...pair, persisted };
    },
    listByAccountDurable: (admin, accountId, limit) =>
      fetchLedgerByAccount(admin, accountId, limit),
    listByReferenceDurable: (admin, reference) =>
      fetchLedgerByReference(admin, reference),
    health: () => ({
      id: "ledger",
      label: "Ledger",
      status: "healthy",
      detail: `Append-only · ${entries.length} in-memory · durable table financial_ledger_entries`,
      enabled: true,
    }),
    healthAsync: async (admin) => {
      if (!admin) return createLedgerModule().health();
      const count = await countLedgerEntries(admin);
      if (count === null) {
        return {
          id: "ledger",
          label: "Ledger",
          status: "warning",
          detail: "financial_ledger_entries unreachable — using memory buffer",
          enabled: true,
        };
      }
      return {
        id: "ledger",
        label: "Ledger",
        status: "healthy",
        detail: `Append-only · ${count} durable entries`,
        enabled: true,
      };
    },
  };
}

/** Test helper — clear in-memory ledger. */
export function __resetLedgerForTests(): void {
  entries.length = 0;
}
