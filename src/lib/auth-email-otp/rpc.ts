import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
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
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const token = otpServerToken();
  if (url && key && token) {
    return createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  try {
    return createAdminClient();
  } catch {
    return null;
  }
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
  const email = params.email.trim().toLowerCase();

  const { error } = await client.rpc("yike_signup_pending_upsert", {
    p_token: token(),
    p_email: email,
    p_username: params.username,
    p_full_name: params.fullName,
    p_phone: params.phone,
    p_pin_hash: params.pinHash,
    p_phone_verified: params.phoneVerified,
    p_expires_at: params.expiresAt,
  });
  if (!error) return true;

  console.error("[auth-email-otp] pending upsert RPC failed", error.message);

  const admin = createAdminClient();
  if (!admin) return false;

  const { error: directError } = await admin.from("auth_signup_pending").upsert(
    {
      email,
      username: params.username.trim().toLowerCase(),
      full_name: params.fullName.trim(),
      phone: params.phone.trim() || null,
      pin_hash: params.pinHash,
      phone_verified: params.phoneVerified,
      expires_at: params.expiresAt,
    },
    { onConflict: "email" }
  );

  if (directError) {
    console.error("[auth-email-otp] pending direct upsert failed", directError.message);
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
  const { error } = await client.rpc("yike_auth_otp_invalidate_active", {
    p_token: token(),
    p_email: email.trim().toLowerCase(),
    p_purpose: purpose,
  });
  if (!error) return;

  const admin = createAdminClient();
  if (!admin) return;
  await admin
    .from("auth_email_otps")
    .update({ consumed_at: new Date().toISOString() })
    .eq("email", email.trim().toLowerCase())
    .eq("purpose", purpose)
    .is("consumed_at", null);
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
  if (!error && data) {
    return String(data);
  }

  if (error) {
    console.error("[auth-email-otp] RPC insert failed", error.message);
  }

  const admin = createAdminClient();
  if (!admin) return null;

  const { data: row, error: insertError } = await admin
    .from("auth_email_otps")
    .insert({
      email: params.email.trim().toLowerCase(),
      purpose: params.purpose,
      otp_hash: params.otpHash,
      expires_at: params.expiresAt,
      ip_hash: params.ipHash,
      user_agent_hash: params.userAgentHash,
    })
    .select("id")
    .single();

  if (insertError || !row) {
    console.error("[auth-email-otp] admin insert failed", insertError?.message);
    return null;
  }

  return String(row.id);
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
  if (!error) {
    const row = Array.isArray(data) ? data[0] : data;
    return (row as AuthOtpRow | undefined) ?? null;
  }

  const admin = createAdminClient();
  if (!admin) return null;
  const { data: rows } = await admin
    .from("auth_email_otps")
    .select("id, otp_hash, expires_at, attempts, max_attempts")
    .eq("email", email.trim().toLowerCase())
    .eq("purpose", purpose)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1);

  return (rows?.[0] as AuthOtpRow | undefined) ?? null;
}

export async function authOtpIncrementAttempts(
  client: SupabaseClient,
  id: string
): Promise<number> {
  const { data } = await client.rpc("yike_auth_otp_increment_attempts", {
    p_token: token(),
    p_id: id,
  });
  if (typeof data === "number") return data;

  const admin = createAdminClient();
  if (!admin) return 0;
  const { data: row } = await admin
    .from("auth_email_otps")
    .select("attempts")
    .eq("id", id)
    .single();
  const next = (row?.attempts ?? 0) + 1;
  await admin.from("auth_email_otps").update({ attempts: next }).eq("id", id);
  return next;
}

export async function authOtpConsume(
  client: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client.rpc("yike_auth_otp_consume", {
    p_token: token(),
    p_id: id,
  });
  if (!error) return;

  const admin = createAdminClient();
  if (!admin) return;
  await admin
    .from("auth_email_otps")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", id);
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
