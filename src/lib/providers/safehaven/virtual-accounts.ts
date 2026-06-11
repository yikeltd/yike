import type { SupabaseClient } from "@supabase/supabase-js";
import { isSafeHavenVaEnabled } from "./config";
import { createSafeHavenVirtualAccount } from "./client";
import { logSafeHavenEvent, writeSafeHavenProviderLog } from "./logging";
import type { SafeHavenProviderResult } from "./types";

export async function getOrCreateUserVirtualAccount(
  admin: SupabaseClient,
  params: {
    userId: string;
    accountName: string;
    email?: string | null;
    phone?: string | null;
  }
): Promise<
  SafeHavenProviderResult<{
    id: string;
    account_number: string | null;
    status: string;
  }>
> {
  const { data: existing } = await admin
    .from("safehaven_virtual_accounts")
    .select("id, account_number, status, provider_reference")
    .eq("user_id", params.userId)
    .maybeSingle();

  if (existing && ["active", "pending"].includes(existing.status)) {
    return {
      ok: true,
      data: {
        id: existing.id,
        account_number: existing.account_number,
        status: existing.status,
      },
    };
  }

  if (!isSafeHavenVaEnabled()) {
    return {
      ok: false,
      code: "virtual_account_disabled",
      error: "Virtual accounts are not enabled.",
    };
  }

  const started = Date.now();
  logSafeHavenEvent("safehaven_va_create_started", { userId: params.userId });

  const idempotencyKey = `va_${params.userId}`;
  const created = await createSafeHavenVirtualAccount({
    userId: params.userId,
    accountName: params.accountName,
    email: params.email,
    phone: params.phone,
    idempotencyKey,
  });

  if (!created.ok) {
    logSafeHavenEvent("safehaven_va_create_failed", { userId: params.userId });
    await writeSafeHavenProviderLog(admin, {
      action: "safehaven_va_create_failed",
      status: "failed",
      errorCode: created.code,
      errorMessage: created.error,
      durationMs: Date.now() - started,
      requestSummary: { userId: params.userId },
    });
    return created;
  }

  const raw = created.data;
  const providerReference = String(
    raw.reference ?? raw.providerReference ?? raw.id ?? ""
  ).trim() || null;
  const accountNumber = String(
    raw.accountNumber ?? raw.account_number ?? ""
  ).trim() || null;

  const { data: row, error } = await admin
    .from("safehaven_virtual_accounts")
    .upsert(
      {
        user_id: params.userId,
        provider: "safehaven",
        provider_reference: providerReference,
        account_number: accountNumber,
        account_name: params.accountName,
        bank_name: String(raw.bankName ?? raw.bank_name ?? "Safe Haven"),
        bank_code: String(raw.bankCode ?? raw.bank_code ?? ""),
        status: accountNumber ? "active" : "pending",
        raw_response: raw,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("id, account_number, status")
    .single();

  if (error || !row) {
    return {
      ok: false,
      code: "provider_unavailable",
      error: "Could not save virtual account.",
    };
  }

  logSafeHavenEvent("safehaven_va_create_success", { userId: params.userId });
  await writeSafeHavenProviderLog(admin, {
    action: "safehaven_va_create_success",
    status: "success",
    providerReference,
    durationMs: Date.now() - started,
    responseSummary: { accountNumber: accountNumber ? "[present]" : null },
  });

  return { ok: true, data: row };
}
