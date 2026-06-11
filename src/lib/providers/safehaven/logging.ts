import type { SupabaseClient } from "@supabase/supabase-js";

export type SafeHavenLogAction =
  | "safehaven_oauth_started"
  | "safehaven_oauth_success"
  | "safehaven_oauth_failed"
  | "safehaven_va_create_started"
  | "safehaven_va_create_success"
  | "safehaven_va_create_failed"
  | "safehaven_webhook_received"
  | "safehaven_webhook_duplicate"
  | "safehaven_webhook_processed"
  | "safehaven_webhook_failed"
  | "safehaven_transfer_started"
  | "safehaven_transfer_success"
  | "safehaven_transfer_failed"
  | "safehaven_transaction_verify"
  | "safehaven_health_check";

export function logSafeHavenEvent(
  action: SafeHavenLogAction,
  detail?: Record<string, unknown>
): void {
  console.info(`[${action}]`, detail ? JSON.stringify(redactSafeHavenLog(detail)) : "");
}

export async function writeSafeHavenProviderLog(
  admin: SupabaseClient,
  row: {
    action: string;
    status: string;
    providerReference?: string | null;
    requestSummary?: Record<string, unknown> | null;
    responseSummary?: Record<string, unknown> | null;
    errorCode?: string | null;
    errorMessage?: string | null;
    durationMs?: number | null;
  }
): Promise<void> {
  try {
    await admin.from("safehaven_provider_logs").insert({
      action: row.action,
      status: row.status,
      provider_reference: row.providerReference ?? null,
      request_summary: row.requestSummary ?? null,
      response_summary: row.responseSummary ?? null,
      error_code: row.errorCode ?? null,
      error_message: row.errorMessage ?? null,
      duration_ms: row.durationMs ?? null,
    });
  } catch (err) {
    console.error("[safehaven] provider log insert failed", err);
  }
}

function redactSafeHavenLog(detail: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(detail)) {
    const lower = key.toLowerCase();
    if (
      lower.includes("secret") ||
      lower.includes("token") ||
      lower.includes("authorization") ||
      lower.includes("private") ||
      lower.includes("password")
    ) {
      out[key] = "[redacted]";
    } else {
      out[key] = value;
    }
  }
  return out;
}
