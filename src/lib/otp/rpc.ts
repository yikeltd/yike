import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OtpChannel } from "@/lib/notifications/types";
import { OTP_PROVIDER } from "./constants";

export type OtpRow = {
  id: string;
  otp_hash: string;
  expires_at: string;
  verified: boolean;
  attempts: number;
  last_sent_at: string | null;
  channel: OtpChannel | null;
  status: string | null;
};

function otpServerToken(): string | null {
  return process.env.YIKE_OTP_SERVER_TOKEN?.trim() || null;
}

/** Server OTP DB access via service-role RPC. */
export function createOtpDbClient(): SupabaseClient | null {
  if (!otpServerToken()) return null;

  try {
    return createAdminClient();
  } catch (error) {
    console.error("[otp-rpc] admin client unavailable", (error as Error).message);
    return null;
  }
}

function token(): string {
  const t = otpServerToken();
  if (!t) throw new Error("YIKE_OTP_SERVER_TOKEN not configured");
  return t;
}

export async function otpLastSentAt(
  client: SupabaseClient,
  phone: string
): Promise<string | null> {
  const { data, error } = await client.rpc("yike_otp_last_sent_at", {
    p_token: token(),
    p_phone: phone,
  });
  if (error) {
    console.error("[otp-rpc] last sent failed", phone, error.message);
    return null;
  }
  return typeof data === "string" ? data : null;
}

export async function otpLatestVerifiableRow(
  client: SupabaseClient,
  phone: string
): Promise<OtpRow | null> {
  const { data, error } = await client.rpc("yike_otp_latest_verifiable", {
    p_token: token(),
    p_phone: phone,
  });
  if (error) {
    console.error("[otp-rpc] latest verifiable failed", phone, error.message);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return (row as OtpRow | undefined) ?? null;
}

export async function otpLatestRow(
  client: SupabaseClient,
  phone: string
): Promise<OtpRow | null> {
  const { data, error } = await client.rpc("yike_otp_latest", {
    p_token: token(),
    p_phone: phone,
  });
  if (error) {
    console.error("[otp-rpc] latest failed", phone, error.message);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return (row as OtpRow | undefined) ?? null;
}

export async function otpInsertPending(
  client: SupabaseClient,
  params: {
    phone: string;
    otpHash: string;
    expiresAt: string;
    channel: OtpChannel;
    lastSentAt?: string | null;
  }
): Promise<{ id: string } | null> {
  const { data, error } = await client.rpc("yike_otp_insert_pending", {
    p_token: token(),
    p_phone: params.phone,
    p_otp_hash: params.otpHash,
    p_expires_at: params.expiresAt,
    p_channel: params.channel,
    p_provider: OTP_PROVIDER,
    p_last_sent_at: params.lastSentAt ?? null,
  });
  if (error) {
    console.error("[otp-rpc] insert failed", params.phone, error.message);
    return null;
  }
  const id = typeof data === "string" ? data : String(data ?? "");
  return id ? { id } : null;
}

export async function otpMarkSent(
  client: SupabaseClient,
  id: string,
  channel: OtpChannel,
  providerReference?: string
): Promise<void> {
  const { error } = await client.rpc("yike_otp_mark_sent", {
    p_token: token(),
    p_id: id,
    p_channel: channel,
    p_provider_reference: providerReference ?? null,
  });
  if (error) console.error("[otp-rpc] mark sent failed", id, error.message);
}

export async function otpMarkFailed(
  client: SupabaseClient,
  id: string,
  errorMessage: string | null
): Promise<void> {
  const { error } = await client.rpc("yike_otp_mark_failed", {
    p_token: token(),
    p_id: id,
    p_error_message: errorMessage,
  });
  if (error) console.error("[otp-rpc] mark failed", id, error.message);
}

export async function otpMarkExpired(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.rpc("yike_otp_mark_expired", {
    p_token: token(),
    p_id: id,
  });
  if (error) console.error("[otp-rpc] mark expired failed", id, error.message);
}

export async function otpIncrementAttempts(
  client: SupabaseClient,
  id: string
): Promise<number | null> {
  const { data, error } = await client.rpc("yike_otp_increment_attempts", {
    p_token: token(),
    p_id: id,
  });
  if (error) {
    console.error("[otp-rpc] increment attempts failed", id, error.message);
    return null;
  }
  return typeof data === "number" ? data : null;
}

export async function otpVerifySuccess(
  client: SupabaseClient,
  id: string,
  verificationToken: string
): Promise<boolean> {
  const { error } = await client.rpc("yike_otp_verify_success", {
    p_token: token(),
    p_id: id,
    p_verification_token: verificationToken,
  });
  if (error) {
    console.error("[otp-rpc] verify success failed", id, error.message);
    return false;
  }
  return true;
}

export async function otpLogEvent(
  client: SupabaseClient,
  params: {
    phone: string;
    channel: OtpChannel;
    status: string;
    attempts?: number;
    expiresAt?: string;
    providerError?: string;
    errorMessage?: string | null;
  }
): Promise<void> {
  const { sanitizeOtpError } = await import("./logs");
  const errorMessage =
    params.errorMessage ?? sanitizeOtpError(params.providerError);
  const { error } = await client.rpc("yike_otp_log_event", {
    p_token: token(),
    p_phone: params.phone,
    p_channel: params.channel,
    p_status: params.status,
    p_attempts: params.attempts ?? 0,
    p_expires_at: params.expiresAt ?? null,
    p_error_message: errorMessage,
  });
  if (error) console.error("[otp-rpc] log event failed", params.phone, error.message);
}

export async function otpFindVerified(
  client: SupabaseClient,
  phone: string,
  verificationToken: string
): Promise<{ id: string } | null> {
  const { data, error } = await client.rpc("yike_otp_find_verified", {
    p_token: token(),
    p_phone: phone,
    p_verification_token: verificationToken,
  });
  if (error) {
    console.error("[otp-rpc] find verified failed", phone, error.message);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return row?.id ? { id: row.id as string } : null;
}
