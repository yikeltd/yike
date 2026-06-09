import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export type EmailOtpRow = {
  id: string;
  otp_hash: string;
  expires_at: string;
  verified: boolean;
  attempts: number;
  last_sent_at: string | null;
  status: string | null;
};

function otpServerToken(): string | null {
  return process.env.YIKE_OTP_SERVER_TOKEN?.trim() || null;
}

export function createEmailOtpDbClient(): SupabaseClient | null {
  if (!otpServerToken()) return null;

  try {
    return createAdminClient();
  } catch (error) {
    console.error("[email-otp-rpc] admin client unavailable", (error as Error).message);
    return null;
  }
}

function token(): string {
  const t = otpServerToken();
  if (!t) throw new Error("YIKE_OTP_SERVER_TOKEN not configured");
  return t;
}

export async function emailOtpLastSentAt(
  client: SupabaseClient,
  email: string
): Promise<string | null> {
  const { data, error } = await client.rpc("yike_email_otp_last_sent_at", {
    p_token: token(),
    p_email: email.trim().toLowerCase(),
  });
  if (error) return null;
  return typeof data === "string" ? data : null;
}

export async function emailOtpInsertPending(
  client: SupabaseClient,
  params: {
    email: string;
    otpHash: string;
    expiresAt: string;
    userId?: string | null;
    lastSentAt: string;
  }
): Promise<string | null> {
  const { data, error } = await client.rpc("yike_email_otp_insert_pending", {
    p_token: token(),
    p_email: params.email.trim().toLowerCase(),
    p_otp_hash: params.otpHash,
    p_expires_at: params.expiresAt,
    p_user_id: params.userId ?? null,
    p_last_sent_at: params.lastSentAt,
  });
  if (error || !data) {
    console.error("[email-otp-rpc] insert failed", error?.message);
    return null;
  }
  return String(data);
}

export async function emailOtpLatestVerifiable(
  client: SupabaseClient,
  email: string
): Promise<EmailOtpRow | null> {
  const { data, error } = await client.rpc("yike_email_otp_latest_verifiable", {
    p_token: token(),
    p_email: email.trim().toLowerCase(),
  });
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return (row as EmailOtpRow | undefined) ?? null;
}

export async function emailOtpMarkSent(
  client: SupabaseClient,
  id: string
): Promise<void> {
  await client.rpc("yike_email_otp_mark_sent", { p_token: token(), p_id: id });
}

export async function emailOtpIncrementAttempts(
  client: SupabaseClient,
  id: string
): Promise<number> {
  const { data } = await client.rpc("yike_email_otp_increment_attempts", {
    p_token: token(),
    p_id: id,
  });
  return typeof data === "number" ? data : 0;
}

export async function emailOtpVerifySuccess(
  client: SupabaseClient,
  id: string
): Promise<void> {
  await client.rpc("yike_email_otp_verify_success", { p_token: token(), p_id: id });
}

export async function emailConfirmUser(
  client: SupabaseClient,
  email: string
): Promise<boolean> {
  const { error } = await client.rpc("yike_email_confirm_user", {
    p_token: token(),
    p_email: email.trim().toLowerCase(),
  });
  if (error) {
    console.error("[email-otp-rpc] confirm user failed", error.message);
    return false;
  }
  return true;
}
