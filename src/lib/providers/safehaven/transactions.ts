import type { SupabaseClient } from "@supabase/supabase-js";
import { verifySafeHavenTransaction as verifyProviderTransaction } from "./client";
import { logSafeHavenEvent, writeSafeHavenProviderLog } from "./logging";

export type SafeHavenTransactionInput = {
  userId?: string | null;
  virtualAccountId?: string | null;
  providerReference?: string | null;
  transactionReference?: string | null;
  type?: string | null;
  direction?: string | null;
  amount?: number | null;
  fee?: number | null;
  currency?: string | null;
  status?: string | null;
  narration?: string | null;
  rawResponse?: Record<string, unknown> | null;
  occurredAt?: string | null;
};

export async function recordSafeHavenTransaction(
  admin: SupabaseClient,
  payload: SafeHavenTransactionInput
): Promise<
  | { ok: true; id: string; duplicate: boolean }
  | { ok: false; code: "transaction_already_processed"; error: string }
> {
  const providerRef = payload.providerReference?.trim() || null;
  const txRef = payload.transactionReference?.trim() || null;

  if (providerRef) {
    const { data: existing } = await admin
      .from("safehaven_transactions")
      .select("id, status")
      .eq("provider_reference", providerRef)
      .maybeSingle();

    if (existing) {
      return {
        ok: true,
        id: existing.id,
        duplicate: true,
      };
    }
  }

  if (txRef) {
    const { data: existing } = await admin
      .from("safehaven_transactions")
      .select("id, status")
      .eq("transaction_reference", txRef)
      .maybeSingle();

    if (existing) {
      return {
        ok: true,
        id: existing.id,
        duplicate: true,
      };
    }
  }

  const { data, error } = await admin
    .from("safehaven_transactions")
    .insert({
      user_id: payload.userId ?? null,
      virtual_account_id: payload.virtualAccountId ?? null,
      provider_reference: providerRef,
      transaction_reference: txRef,
      type: payload.type ?? "collection",
      direction: payload.direction ?? "credit",
      amount: payload.amount ?? 0,
      fee: payload.fee ?? 0,
      currency: payload.currency ?? "NGN",
      status: payload.status ?? "pending",
      narration: payload.narration ?? null,
      raw_response: payload.rawResponse ?? null,
      occurred_at: payload.occurredAt ?? new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return {
        ok: false,
        code: "transaction_already_processed",
        error: "Transaction already processed.",
      };
    }
    throw error;
  }

  return { ok: true, id: data.id, duplicate: false };
}

export async function verifySafeHavenTransactionRecord(
  admin: SupabaseClient,
  reference: string
) {
  const started = Date.now();
  const result = await verifyProviderTransaction(reference);

  await writeSafeHavenProviderLog(admin, {
    action: "safehaven_transaction_verify",
    status: result.ok ? "success" : "failed",
    providerReference: reference,
    durationMs: Date.now() - started,
    errorCode: result.ok ? null : result.code,
    errorMessage: result.ok ? null : result.error,
  });

  return result;
}

export async function markTransactionProcessed(
  admin: SupabaseClient,
  params: {
    providerReference?: string | null;
    transactionReference?: string | null;
    status: string;
    rawResponse?: Record<string, unknown>;
  }
): Promise<boolean> {
  const patch: Record<string, unknown> = {
    status: params.status,
    updated_at: new Date().toISOString(),
  };
  if (params.rawResponse) patch.raw_response = params.rawResponse;

  let query = admin.from("safehaven_transactions").update(patch);

  if (params.providerReference) {
    query = query.eq("provider_reference", params.providerReference);
  } else if (params.transactionReference) {
    query = query.eq("transaction_reference", params.transactionReference);
  } else {
    return false;
  }

  const { error } = await query;
  return !error;
}

export async function processSafeHavenWebhookTransaction(
  admin: SupabaseClient,
  event: {
    providerReference: string | null;
    transactionReference: string | null;
    amount: number | null;
    status: string | null;
    raw: Record<string, unknown>;
  }
): Promise<void> {
  const normalizedStatus = normalizeTransactionStatus(event.status);

  const recorded = await recordSafeHavenTransaction(admin, {
    providerReference: event.providerReference,
    transactionReference: event.transactionReference,
    amount: event.amount,
    status: normalizedStatus,
    type: String(event.raw.type ?? "collection"),
    direction: String(event.raw.direction ?? "credit"),
    rawResponse: event.raw,
    occurredAt: new Date().toISOString(),
  });

  if (!recorded.ok) {
    logSafeHavenEvent("safehaven_webhook_failed", { reason: recorded.code });
    return;
  }

  if (recorded.duplicate) {
    logSafeHavenEvent("safehaven_webhook_duplicate", {
      reference: event.providerReference ?? event.transactionReference,
    });
    await markTransactionProcessed(admin, {
      providerReference: event.providerReference,
      transactionReference: event.transactionReference,
      status: normalizedStatus,
      rawResponse: event.raw,
    });
    return;
  }

  logSafeHavenEvent("safehaven_webhook_processed", {
    transactionId: recorded.id,
  });
}

function normalizeTransactionStatus(status: string | null): string {
  const raw = (status ?? "pending").toLowerCase();
  if (["success", "successful", "completed", "paid"].includes(raw)) return "successful";
  if (["failed", "failure", "declined"].includes(raw)) return "failed";
  if (["reversed", "reversal"].includes(raw)) return "reversed";
  if (["disputed", "dispute"].includes(raw)) return "disputed";
  return "pending";
}
