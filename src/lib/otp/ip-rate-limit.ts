import type { SupabaseClient } from "@supabase/supabase-js";
import { hashClientIp } from "@/lib/auth-email-otp/request-meta";
import { PHONE_VERIFY_COPY } from "@/lib/phone-verification/copy";

/** Align with auth email OTP IP budget (signup abuse). */
function isMissingOtpIpSchema(message: string): boolean {
  return (
    /yike_otp_ip_(send_count_hour|verify_attempts_hour)/.test(message) &&
    /(does not exist|Could not find the function)/.test(message)
  );
}

export const OTP_MAX_SENDS_PER_IP_HOUR = 20;
export const OTP_MAX_VERIFY_ATTEMPTS_PER_IP_HOUR = 40;

export type IpRateLimitResult =
  | { ok: true; ipHash: string | null }
  | { ok: false; error: string; status: number; code: "rate_limited" | "unavailable" };

export function hashRequestIp(request: Request): string | null {
  return hashClientIp(request);
}

export function ipSendLimitExceeded(count: number): boolean {
  return count >= OTP_MAX_SENDS_PER_IP_HOUR;
}

export function ipVerifyLimitExceeded(count: number): boolean {
  return count >= OTP_MAX_VERIFY_ATTEMPTS_PER_IP_HOUR;
}

const HOUR_AGO_ISO = () => new Date(Date.now() - 60 * 60 * 1000).toISOString();

/** WhatsApp / seller SMS session sends for this IP in the last hour. */
export async function countWhatsappSessionSendsForIp(
  admin: SupabaseClient,
  ipHash: string,
): Promise<number | null> {
  const { count, error } = await admin
    .from("whatsapp_otp_sessions")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", HOUR_AGO_ISO());

  if (error) {
    console.error("[otp-ip-limit] whatsapp send count failed", error.message);
    return null;
  }
  return count ?? 0;
}

/** Sum of verify_attempts on sessions tied to this IP (cross-session budget). */
export async function countWhatsappVerifyAttemptsForIp(
  admin: SupabaseClient,
  ipHash: string,
): Promise<number | null> {
  const { data, error } = await admin
    .from("whatsapp_otp_sessions")
    .select("verify_attempts")
    .eq("ip_hash", ipHash)
    .gte("created_at", HOUR_AGO_ISO());

  if (error) {
    console.error("[otp-ip-limit] whatsapp verify count failed", error.message);
    return null;
  }

  return (data ?? []).reduce(
    (sum, row) => sum + (Number(row.verify_attempts) || 0),
    0,
  );
}

export async function assertOtpSendAllowedForIp(
  admin: SupabaseClient,
  request: Request,
): Promise<IpRateLimitResult> {
  const ipHash = hashRequestIp(request);
  if (!ipHash) {
    return { ok: true, ipHash: null };
  }

  const sends = await countWhatsappSessionSendsForIp(admin, ipHash);
  if (sends === null) {
    return {
      ok: false,
      error: PHONE_VERIFY_COPY.providerUnavailable,
      status: 503,
      code: "unavailable",
    };
  }
  if (ipSendLimitExceeded(sends)) {
    return {
      ok: false,
      error: PHONE_VERIFY_COPY.rateLimited,
      status: 429,
      code: "rate_limited",
    };
  }
  return { ok: true, ipHash };
}

export async function assertOtpVerifyAllowedForIp(
  admin: SupabaseClient,
  request: Request,
): Promise<IpRateLimitResult> {
  const ipHash = hashRequestIp(request);
  if (!ipHash) {
    return { ok: true, ipHash: null };
  }

  const attempts = await countWhatsappVerifyAttemptsForIp(admin, ipHash);
  if (attempts === null) {
    return {
      ok: false,
      error: PHONE_VERIFY_COPY.providerUnavailable,
      status: 503,
      code: "unavailable",
    };
  }
  if (ipVerifyLimitExceeded(attempts)) {
    return {
      ok: false,
      error: PHONE_VERIFY_COPY.maxAttempts,
      status: 429,
      code: "rate_limited",
    };
  }
  return { ok: true, ipHash };
}

export async function otpPhoneIpSendCountHour(
  client: SupabaseClient,
  ipHash: string | null,
): Promise<number | null> {
  if (!ipHash) return 0;
  const token = process.env.YIKE_OTP_SERVER_TOKEN?.trim();
  if (!token) return null;

  const { data, error } = await client.rpc("yike_otp_ip_send_count_hour", {
    p_token: token,
    p_ip_hash: ipHash,
  });
  if (error) {
    if (isMissingOtpIpSchema(error.message)) return 0;
    console.error("[otp-ip-limit] phone send count rpc failed", error.message);
    return null;
  }
  return typeof data === "number" ? data : Number(data ?? 0);
}

export async function otpPhoneIpVerifyAttemptsHour(
  client: SupabaseClient,
  ipHash: string | null,
): Promise<number | null> {
  if (!ipHash) return 0;
  const token = process.env.YIKE_OTP_SERVER_TOKEN?.trim();
  if (!token) return null;

  const { data, error } = await client.rpc("yike_otp_ip_verify_attempts_hour", {
    p_token: token,
    p_ip_hash: ipHash,
  });
  if (error) {
    if (isMissingOtpIpSchema(error.message)) return 0;
    console.error("[otp-ip-limit] phone verify count rpc failed", error.message);
    return null;
  }
  return typeof data === "number" ? data : Number(data ?? 0);
}

export async function assertAuthPhoneOtpSendAllowedForIp(
  client: SupabaseClient,
  request: Request,
): Promise<IpRateLimitResult> {
  const ipHash = hashRequestIp(request);
  if (!ipHash) return { ok: true, ipHash: null };

  const sends = await otpPhoneIpSendCountHour(client, ipHash);
  if (sends === null) {
    return {
      ok: false,
      error: PHONE_VERIFY_COPY.providerUnavailable,
      status: 503,
      code: "unavailable",
    };
  }
  if (ipSendLimitExceeded(sends)) {
    return {
      ok: false,
      error: PHONE_VERIFY_COPY.rateLimited,
      status: 429,
      code: "rate_limited",
    };
  }
  return { ok: true, ipHash };
}

export async function assertAuthPhoneOtpVerifyAllowedForIp(
  client: SupabaseClient,
  request: Request,
): Promise<IpRateLimitResult> {
  const ipHash = hashRequestIp(request);
  if (!ipHash) return { ok: true, ipHash: null };

  const attempts = await otpPhoneIpVerifyAttemptsHour(client, ipHash);
  if (attempts === null) {
    return {
      ok: false,
      error: PHONE_VERIFY_COPY.providerUnavailable,
      status: 503,
      code: "unavailable",
    };
  }
  if (ipVerifyLimitExceeded(attempts)) {
    return {
      ok: false,
      error: PHONE_VERIFY_COPY.maxAttempts,
      status: 429,
      code: "rate_limited",
    };
  }
  return { ok: true, ipHash };
}
