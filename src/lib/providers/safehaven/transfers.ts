import type { SupabaseClient } from "@supabase/supabase-js";
import { isSafeHavenTransfersEnabled } from "./config";
import { initiateSafeHavenTransfer } from "./client";
import { logSafeHavenEvent, writeSafeHavenProviderLog } from "./logging";
import { recordSafeHavenTransaction } from "./transactions";
import type { SafeHavenTransferPayload, SafeHavenProviderResult } from "./types";

export async function initiateTransfer(
  admin: SupabaseClient,
  payload: SafeHavenTransferPayload
): Promise<SafeHavenProviderResult<Record<string, unknown>>> {
  if (!isSafeHavenTransfersEnabled()) {
    return {
      ok: false,
      code: "transfer_disabled",
      error: "Transfers are not enabled.",
    };
  }

  const started = Date.now();
  logSafeHavenEvent("safehaven_transfer_started", {
    idempotencyKey: payload.idempotencyKey,
  });

  const result = await initiateSafeHavenTransfer(payload);

  if (!result.ok) {
    logSafeHavenEvent("safehaven_transfer_failed");
    await writeSafeHavenProviderLog(admin, {
      action: "safehaven_transfer_failed",
      status: "failed",
      errorCode: result.code,
      errorMessage: result.error,
      durationMs: Date.now() - started,
      requestSummary: {
        amount: payload.amount,
        idempotencyKey: payload.idempotencyKey,
      },
    });
    return result;
  }

  const raw = result.data;
  const providerReference = String(
    raw.reference ?? raw.providerReference ?? raw.id ?? ""
  ).trim() || null;

  await recordSafeHavenTransaction(admin, {
    userId: payload.userId ?? null,
    providerReference,
    transactionReference: String(raw.transactionReference ?? "").trim() || null,
    type: "transfer",
    direction: "debit",
    amount: payload.amount,
    status: "pending",
    narration: payload.narration,
    rawResponse: raw,
  });

  logSafeHavenEvent("safehaven_transfer_success");
  await writeSafeHavenProviderLog(admin, {
    action: "safehaven_transfer_success",
    status: "success",
    providerReference,
    durationMs: Date.now() - started,
  });

  return result;
}

export async function verifyTransfer(
  admin: SupabaseClient,
  reference: string
) {
  const { verifySafeHavenTransactionRecord } = await import("./transactions");
  return verifySafeHavenTransactionRecord(admin, reference);
}
