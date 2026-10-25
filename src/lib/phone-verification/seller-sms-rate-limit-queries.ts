import type { SupabaseClient } from "@supabase/supabase-js";
import { sellerSmsSendCountsTowardHourlyLimit } from "./seller-sms-rate-limit";

const HOUR_MS = 60 * 60 * 1000;

function hourAgoIso(): string {
  return new Date(Date.now() - HOUR_MS).toISOString();
}

type SessionRow = {
  status: string;
  provider_reference: string | null;
  created_at?: string;
};

/**
 * Provider-accepted sends in the last hour for this E.164 number.
 * Excludes failed claims (`pending:*`, later `expired`).
 */
export async function countProviderAcceptedSendsLastHour(
  admin: SupabaseClient,
  phoneIntl: string
): Promise<number> {
  const since = hourAgoIso();
  const { data, error } = await admin
    .from("whatsapp_otp_sessions")
    .select("status, provider_reference")
    .eq("phone_intl", phoneIntl)
    .gte("created_at", since);

  if (error) {
    console.error("[phone-verification] hourly send count failed", error.message);
    return Number.MAX_SAFE_INTEGER;
  }

  return (data ?? []).filter((row) =>
    sellerSmsSendCountsTowardHourlyLimit(row as SessionRow)
  ).length;
}

/** Latest provider-accepted send for cooldown (not failed pre-provider claims). */
export async function lastProviderAcceptedSentAt(
  admin: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await admin
    .from("whatsapp_otp_sessions")
    .select("created_at, status, provider_reference")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[phone-verification] last send lookup failed", error.message);
    return null;
  }

  for (const row of data ?? []) {
    if (sellerSmsSendCountsTowardHourlyLimit(row as SessionRow)) {
      return row.created_at ?? null;
    }
  }
  return null;
}

/** Dev diagnostics — aggregate counts without exposing phone numbers. */
export async function summarizeSellerSmsSendBudget(
  admin: SupabaseClient,
  phoneIntl: string
): Promise<{
  lastHourTotalRows: number;
  lastHourProviderAccepted: number;
  lastHourFailedOrPendingClaims: number;
}> {
  const since = hourAgoIso();
  const { data, error } = await admin
    .from("whatsapp_otp_sessions")
    .select("status, provider_reference")
    .eq("phone_intl", phoneIntl)
    .gte("created_at", since);

  if (error) {
    return {
      lastHourTotalRows: -1,
      lastHourProviderAccepted: -1,
      lastHourFailedOrPendingClaims: -1,
    };
  }

  const rows = data ?? [];
  let accepted = 0;
  let failedOrPending = 0;
  for (const row of rows) {
    if (sellerSmsSendCountsTowardHourlyLimit(row as SessionRow)) accepted += 1;
    else failedOrPending += 1;
  }
  return {
    lastHourTotalRows: rows.length,
    lastHourProviderAccepted: accepted,
    lastHourFailedOrPendingClaims: failedOrPending,
  };
}
