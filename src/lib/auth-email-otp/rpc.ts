import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AuthEmailOtpPurpose } from "./types";

export type AuthOtpRow = {
  id: string;
  otp_hash: string;
  expires_at: string;
  attempts: number;
  max_attempts: number;
};

export type SignupPendingRow = {
  email: string;
  username: string;
  full_name: string;
  phone: string | null;
  pin_hash: string;
  phone_verified: boolean;
  expires_at: string;
};

function otpServerToken(): string | null {
  return process.env.YIKE_OTP_SERVER_TOKEN?.trim() || null;
}

export function createAuthEmailOtpDbClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key || !otpServerToken()) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function token(): string {
  const t = otpServerToken();
  if (!t) throw new Error("YIKE_OTP_SERVER_TOKEN not configured");
  return t;
}

export async function emailIsRegistered(
  client: SupabaseClient,
  email: string
): Promise<boolean | null> {
  const { data, error } = await client.rpc("yike_email_registered", {
    p_token: token(),
    p_email: email.trim().toLowerCase(),
  });
  if (error) return null;
  return Boolean(data);
}

export async function signupPendingUpsert(
  client: SupabaseClient,
  params: {
    email: string;
    username: string;
    fullName: string;
    phone: string;
    pinHash: string;
    phoneVerified: boolean;
    expiresAt: string;
  }
): Promise<boolean> {
  const { error } = await client.rpc("yike_signup_pending_upsert", {
    p_token: token(),
    p_email: params.email.trim().toLowerCase(),
    p_username: params.username,
    p_full_name: params.fullName,
    p_phone: params.phone,
    p_pin_hash: params.pinHash,
    p_phone_verified: params.phoneVerified,
    p_expires_at: params.expiresAt,
  });
  if (error) {
    console.error("[auth-email-otp] pending upsert failed", error.message);
    return false;
  }
  return true;
}

export async function signupPendingGet(
  client: SupabaseClient,
  email: string
): Promise<SignupPendingRow | null> {
  const { data, error } = await client.rpc("yike_signup_pending_get", {
    p_token: token(),
    p_email: email.trim().toLowerCase(),
  });
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return (row as SignupPendingRow | undefined) ?? null;
}

export async function signupPendingDelete(
  client: SupabaseClient,
  email: string
): Promise<void> {
  await client.rpc("yike_signup_pending_delete", {
    p_token: token(),
    p_email: email.trim().toLowerCase(),
  });
}

export async function authOtpInvalidateActive(
  client: SupabaseClient,
  email: string,
  purpose: AuthEmailOtpPurpose
): Promise<void> {
  await client.rpc("yike_auth_otp_invalidate_active", {
    p_token: token(),
    p_email: email.trim().toLowerCase(),
    p_purpose: purpose,
  });
}

export async function authOtpLastSentAt(
  client: SupabaseClient,
  email: string,
  purpose: AuthEmailOtpPurpose
): Promise<string | null> {
  const { data, error } = await client.rpc("yike_auth_otp_last_sent_at", {
    p_token: token(),
    p_email: email.trim().toLowerCase(),
    p_purpose: purpose,
  });
  if (error) return null;
  return typeof data === "string" ? data : null;
}

export async function authOtpSendCountHour(
  client: SupabaseClient,
  email: string,
  purpose: AuthEmailOtpPurpose
): Promise<number> {
  const { data } = await client.rpc("yike_auth_otp_send_count_hour", {
    p_token: token(),
    p_email: email.trim().toLowerCase(),
    p_purpose: purpose,
  });
  return typeof data === "number" ? data : 0;
}

export async function authOtpIpSendCountHour(
  client: SupabaseClient,
  ipHash: string | null
): Promise<number> {
  if (!ipHash) return 0;
  const { data } = await client.rpc("yike_auth_otp_ip_send_count_hour", {
    p_token: token(),
    p_ip_hash: ipHash,
  });
  return typeof data === "number" ? data : 0;
}

export async function authOtpInsert(
  client: SupabaseClient,
  params: {
    email: string;
    purpose: AuthEmailOtpPurpose;
    otpHash: string;
    expiresAt: string;
    ipHash: string | null;
    userAgentHash: string | null;
  }
): Promise<string | null> {
  const { data, error } = await client.rpc("yike_auth_otp_insert", {
    p_token: token(),
    p_email: params.email.trim().toLowerCase(),
    p_purpose: params.purpose,
    p_otp_hash: params.otpHash,
    p_expires_at: params.expiresAt,
    p_ip_hash: params.ipHash,
    p_user_agent_hash: params.userAgentHash,
  });
  if (error || !data) {
    console.error("[auth-email-otp] insert failed", error?.message);
    return null;
  }
  return String(data);
}

export async function authOtpLatestActive(
  client: SupabaseClient,
  email: string,
  purpose: AuthEmailOtpPurpose
): Promise<AuthOtpRow | null> {
  const { data, error } = await client.rpc("yike_auth_otp_latest_active", {
    p_token: token(),
    p_email: email.trim().toLowerCase(),
    p_purpose: purpose,
  });
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return (row as AuthOtpRow | undefined) ?? null;
}

export async function authOtpIncrementAttempts(
  client: SupabaseClient,
  id: string
): Promise<number> {
  const { data } = await client.rpc("yike_auth_otp_increment_attempts", {
    p_token: token(),
    p_id: id,
  });
  return typeof data === "number" ? data : 0;
}

export async function authOtpConsume(
  client: SupabaseClient,
  id: string
): Promise<void> {
  await client.rpc("yike_auth_otp_consume", { p_token: token(), p_id: id });
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
    console.error("[auth-email-otp] confirm user failed", error.message);
    return false;
  }
  return true;
}
