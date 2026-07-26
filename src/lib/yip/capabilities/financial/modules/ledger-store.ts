/**
 * Durable ledger persistence — service-role inserts only (never UPDATE).
 * Memory ring buffer remains for tests / fail-soft when DB unavailable.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LedgerEntry } from "../types";

export async function persistLedgerEntries(
  admin: SupabaseClient,
  entries: LedgerEntry[],
  opts?: { paymentOrderId?: string | null }
): Promise<{ ok: boolean; error?: string }> {
  if (entries.length === 0) return { ok: true };

  const rows = entries.map((e) => ({
    id: e.id,
    entry_type: e.type,
    account_id: e.accountId,
    amount: e.amount,
    currency: e.currency,
    direction: e.direction,
    reference: e.reference,
    correlation_id: e.correlationId,
    capability: e.capability,
    provider: e.provider ?? null,
    payment_order_id: opts?.paymentOrderId ?? null,
    metadata: e.metadata ?? {},
    created_at: e.createdAt,
  }));

  const { error } = await admin.from("financial_ledger_entries").insert(rows);
  if (error) {
    const msg = error.message ?? "";
    // Idempotent replay — unique constraint hit
    if (/duplicate|unique/i.test(msg)) return { ok: true };
    return { ok: false, error: msg };
  }

  return { ok: true };
}

export async function fetchLedgerByReference(
  admin: SupabaseClient,
  reference: string
): Promise<LedgerEntry[]> {
  const { data } = await admin
    .from("financial_ledger_entries")
    .select("*")
    .eq("reference", reference)
    .order("created_at", { ascending: true });

  return (data ?? []).map(rowToEntry);
}

export async function fetchLedgerByAccount(
  admin: SupabaseClient,
  accountId: string,
  limit = 50
): Promise<LedgerEntry[]> {
  const { data } = await admin
    .from("financial_ledger_entries")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map(rowToEntry);
}

export async function countLedgerEntries(
  admin: SupabaseClient
): Promise<number | null> {
  const { count, error } = await admin
    .from("financial_ledger_entries")
    .select("id", { count: "exact", head: true });
  if (error) return null;
  return count ?? 0;
}

function rowToEntry(row: Record<string, unknown>): LedgerEntry {
  return {
    id: String(row.id),
    type: row.entry_type as LedgerEntry["type"],
    accountId: String(row.account_id),
    amount: Number(row.amount),
    currency: String(row.currency ?? "NGN"),
    direction: row.direction as LedgerEntry["direction"],
    reference: String(row.reference),
    correlationId: String(row.correlation_id),
    capability: String(row.capability ?? "financial.platform"),
    provider: (row.provider as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? undefined,
    createdAt: String(row.created_at),
  };
}
