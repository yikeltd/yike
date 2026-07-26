import { createHash, randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isPhoneOtpEnabled, isSmsOtpEnabled } from "@/lib/feature-flags";
import { isAuthSmsVerificationBypassActive } from "@/lib/auth/sms-verification-flag";
import {
  normalizePhoneForDuplicateCheck,
  toInternationalNigerianPhone,
} from "@/lib/phone";
import { logOtpAudit, newOtpRequestId } from "@/lib/otp/delivery-audit";
import { resolveDefaultPhoneVerificationChannel } from "./channel";
import { PHONE_VERIFY_COPY } from "./copy";
import { getPhoneVerificationProvider } from "./provider";
import type { PhoneVerificationChannel } from "./types";

const MAX_SENDS_PER_PHONE_HOUR = 3;
const MAX_VERIFY_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60_000;

/** In-flight send locks: one user action → one OTP generation + one SMS (per process). */
const sendInFlight = new Map<string, Promise<SendPhoneVerificationResult>>();

function hashIp(request: Request): string | null {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim();
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

async function countSendsLastHour(
  admin: SupabaseClient,
  phoneIntl: string
): Promise<number> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("whatsapp_otp_sessions")
    .select("id", { count: "exact", head: true })
    .eq("phone_intl", phoneIntl)
    .gte("created_at", since);
  return count ?? 0;
}

async function lastSentAt(
  admin: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await admin
    .from("whatsapp_otp_sessions")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.created_at ?? null;
}

export type SendPhoneVerificationResult =
  | {
      ok: true;
      message: string;
      channel: PhoneVerificationChannel;
      expiresMinutes: number;
      /** FAT only — phone marked verified without SMS. */
      bypass?: true;
      phoneVerified?: true;
      phoneVerifiedAt?: string;
      phone?: string;
    }
  | { ok: false; error: string; status: number; code?: string };

export type VerifyPhoneVerificationResult =
  | {
      ok: true;
      message: string;
      phoneVerified: true;
      phoneVerifiedAt: string;
      phone: string;
    }
  | { ok: false; error: string; status: number };

/** Seller / profile SMS OTP — independent of WhatsApp Business verification. */
export function isSellerPhoneSmsOtpEnabled(): boolean {
  if (isAuthSmsVerificationBypassActive()) return false;
  if (!isPhoneOtpEnabled()) return false;
  if (!isSmsOtpEnabled()) return false;
  return resolveDefaultPhoneVerificationChannel() === "sms";
}

/**
 * FAT-only: mark phone verified without Sendchamp.
 * Gated by AUTH_SMS_VERIFICATION_ENABLED=false — no-op otherwise.
 */
export async function markSellerPhoneVerifiedForFatBypass(
  admin: SupabaseClient,
  params: { userId: string; phoneLocal: string },
): Promise<VerifyPhoneVerificationResult> {
  if (!isAuthSmsVerificationBypassActive()) {
    return {
      ok: false,
      error: "SMS verification bypass is not active",
      status: 403,
    };
  }

  const phoneIntl = toInternationalNigerianPhone(params.phoneLocal);
  if (!phoneIntl) {
    return { ok: false, error: PHONE_VERIFY_COPY.invalidPhone, status: 400 };
  }

  const now = new Date().toISOString();
  const normalizedPhone = normalizePhoneForDuplicateCheck(params.phoneLocal);
  const phoneVerifiedPatch: Record<string, unknown> = {
    phone_verified: true,
    phone_verified_at: now,
    phone: params.phoneLocal,
    whatsapp: params.phoneLocal,
    normalized_phone: normalizedPhone,
    whatsapp_verified_at: now,
    whatsapp_verification_status: "verified",
    whatsapp_verification_reference: null,
    whatsapp_verification_attempts: 0,
  };

  let { error: phonePatchError } = await admin
    .from("profiles")
    .update(phoneVerifiedPatch)
    .eq("id", params.userId);

  if (phonePatchError?.message?.includes("phone_verified_at")) {
    delete phoneVerifiedPatch.phone_verified_at;
    const retry = await admin
      .from("profiles")
      .update(phoneVerifiedPatch)
      .eq("id", params.userId);
    phonePatchError = retry.error;
  }

  if (phonePatchError) {
    console.error(
      "[phone-verification] FAT bypass profile update failed",
      phonePatchError.message,
    );
    return {
      ok: false,
      error: PHONE_VERIFY_COPY.providerUnavailable,
      status: 500,
    };
  }

  logOtpAudit({
    event: "seller_sms_bypass_marked_verified",
    requestId: newOtpRequestId(),
    phone: phoneIntl,
  });

  return {
    ok: true,
    message: "Phone verified for testing (SMS bypass active).",
    phoneVerified: true,
    phoneVerifiedAt: now,
    phone: params.phoneLocal,
  };
}

async function sendSellerPhoneVerificationCodeUnlocked(
  admin: SupabaseClient,
  params: {
    userId: string;
    phoneLocal: string;
    phoneIntl: string;
    email?: string | null;
    request: Request;
    updateProfilePhone?: boolean;
    channel: PhoneVerificationChannel;
    requestId: string;
  }
): Promise<SendPhoneVerificationResult> {
  const { requestId } = params;
  const provider = getPhoneVerificationProvider();

  logOtpAudit({
    event: "seller_send_start",
    requestId,
    phone: params.phoneIntl,
  });

  if (!provider.isConfigured()) {
    return {
      ok: false,
      error: PHONE_VERIFY_COPY.providerUnavailable,
      status: 503,
      code: "not_configured",
    };
  }

  const sends = await countSendsLastHour(admin, params.phoneIntl);
  if (sends >= MAX_SENDS_PER_PHONE_HOUR) {
    logOtpAudit({
      event: "seller_send_rate_limited",
      requestId,
      phone: params.phoneIntl,
    });
    return {
      ok: false,
      error: PHONE_VERIFY_COPY.rateLimited,
      status: 429,
      code: "rate_limited",
    };
  }

  const last = await lastSentAt(admin, params.userId);
  if (last) {
    const elapsed = Date.now() - new Date(last).getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      logOtpAudit({
        event: "seller_send_cooldown",
        requestId,
        phone: params.phoneIntl,
      });
      return {
        ok: false,
        error: PHONE_VERIFY_COPY.cooldown,
        status: 429,
        code: "cooldown",
      };
    }
  }

  if (params.updateProfilePhone !== false) {
    const normalizedPhone = normalizePhoneForDuplicateCheck(params.phoneLocal);
    await admin
      .from("profiles")
      .update({
        phone: params.phoneLocal,
        whatsapp: params.phoneLocal,
        normalized_phone: normalizedPhone,
      })
      .eq("id", params.userId);
  }

  // One active OTP per phone: expire prior unconsumed sessions for this user+number.
  const invalidateAt = new Date().toISOString();
  await admin
    .from("whatsapp_otp_sessions")
    .update({ status: "expired", consumed_at: invalidateAt })
    .eq("user_id", params.userId)
    .eq("phone_intl", params.phoneIntl)
    .eq("status", "sent");

  // Claim a DB row before provider call so cooldown starts immediately (blocks races).
  const claimExpiresAt = new Date(Date.now() + 30 * 60_000).toISOString();
  const claimReference = `pending:${randomUUID()}`;
  const { data: claimRow, error: claimError } = await admin
    .from("whatsapp_otp_sessions")
    .insert({
      user_id: params.userId,
      phone_local: params.phoneLocal,
      phone_intl: params.phoneIntl,
      provider_reference: claimReference,
      channel: params.channel,
      status: "sent",
      verify_attempts: 0,
      expires_at: claimExpiresAt,
      ip_hash: hashIp(params.request),
    })
    .select("id")
    .single();

  if (claimError || !claimRow?.id) {
    console.error("[phone-verification] claim insert failed", claimError?.message);
    logOtpAudit({
      event: "seller_claim_failed",
      requestId,
      phone: params.phoneIntl,
      error: claimError?.message,
    });
    return {
      ok: false,
      error: PHONE_VERIFY_COPY.providerUnavailable,
      status: 500,
    };
  }

  logOtpAudit({
    event: "seller_claim_ok",
    requestId,
    phone: params.phoneIntl,
    reference: claimReference,
    otpHash: claimRow.id,
  });

  const created = await provider.sendOtp({
    phoneIntl: params.phoneIntl,
    channel: params.channel,
    email: params.email ?? undefined,
    purpose: "phone_verification",
    requestId,
  });

  if (!created.ok) {
    console.error("[phone-verification] send failed", {
      channel: params.channel,
      error: created.error,
      status: created.status,
      requestId,
    });
    await admin
      .from("whatsapp_otp_sessions")
      .update({
        status: "expired",
        consumed_at: new Date().toISOString(),
      })
      .eq("id", claimRow.id);
    logOtpAudit({
      event: "seller_send_failed",
      requestId,
      phone: params.phoneIntl,
      error: created.error,
    });
    return {
      ok: false,
      error: created.error,
      status: created.status,
      code: created.code ?? "provider_failed",
    };
  }

  const expiresAt = new Date(Date.now() + created.expiresMinutes * 60_000).toISOString();

  await admin
    .from("whatsapp_otp_sessions")
    .update({
      provider_reference: created.reference,
      channel: created.channel,
      status: "sent",
      expires_at: expiresAt,
    })
    .eq("id", claimRow.id);

  logOtpAudit({
    event: "seller_send_ok",
    requestId,
    phone: params.phoneIntl,
    reference: created.reference,
    deliveryReference: created.reference,
  });

  return {
    ok: true,
    message: created.message,
    channel: created.channel,
    expiresMinutes: created.expiresMinutes,
  };
}

export async function sendSellerPhoneVerificationCode(
  admin: SupabaseClient,
  params: {
    userId: string;
    phoneLocal: string;
    email?: string | null;
    request: Request;
    updateProfilePhone?: boolean;
    channel?: PhoneVerificationChannel;
  }
): Promise<SendPhoneVerificationResult> {
  // FAT bypass — mark verified immediately; no SMS provider call.
  if (isAuthSmsVerificationBypassActive()) {
    const marked = await markSellerPhoneVerifiedForFatBypass(admin, {
      userId: params.userId,
      phoneLocal: params.phoneLocal,
    });
    if (!marked.ok) {
      return {
        ok: false,
        error: marked.error,
        status: marked.status,
        code: "sms_bypass_failed",
      };
    }
    return {
      ok: true,
      message: marked.message,
      channel: "sms",
      expiresMinutes: 0,
      bypass: true,
      phoneVerified: true,
      phoneVerifiedAt: marked.phoneVerifiedAt,
      phone: marked.phone,
    };
  }

  if (!isSellerPhoneSmsOtpEnabled() && params.channel !== "whatsapp") {
    return {
      ok: false,
      error: PHONE_VERIFY_COPY.providerUnavailable,
      status: 503,
      code: "phone_otp_disabled",
    };
  }

  const channel = params.channel ?? resolveDefaultPhoneVerificationChannel();
  const phoneIntl = toInternationalNigerianPhone(params.phoneLocal);
  if (!phoneIntl) {
    return { ok: false, error: PHONE_VERIFY_COPY.invalidPhone, status: 400 };
  }

  const requestId = newOtpRequestId();
  const lockKey = `${params.userId}:${phoneIntl}:${channel}`;
  const existing = sendInFlight.get(lockKey);
  if (existing) {
    // Same in-flight request — await it; do not generate/send a second OTP.
    logOtpAudit({
      event: "seller_send_deduped",
      requestId,
      phone: phoneIntl,
    });
    return existing;
  }

  const pending = sendSellerPhoneVerificationCodeUnlocked(admin, {
    userId: params.userId,
    phoneLocal: params.phoneLocal,
    phoneIntl,
    email: params.email,
    request: params.request,
    updateProfilePhone: params.updateProfilePhone,
    channel,
    requestId,
  }).finally(() => {
    if (sendInFlight.get(lockKey) === pending) {
      sendInFlight.delete(lockKey);
    }
  });

  sendInFlight.set(lockKey, pending);
  return pending;
}

export async function verifySellerPhoneCode(
  admin: SupabaseClient,
  params: {
    userId: string;
    code: string;
  }
): Promise<VerifyPhoneVerificationResult> {
  if (!isSellerPhoneSmsOtpEnabled()) {
    return { ok: false, error: PHONE_VERIFY_COPY.providerUnavailable, status: 503 };
  }

  const code = params.code.trim();
  if (!/^\d{6}$/.test(code)) {
    return { ok: false, error: PHONE_VERIFY_COPY.invalidCode, status: 400 };
  }

  // Latest unexpired OTP for this user (normalized phone was set at send time).
  const { data: session } = await admin
    .from("whatsapp_otp_sessions")
    .select(
      "id, provider_reference, verify_attempts, expires_at, status, phone_local, phone_intl, channel"
    )
    .eq("user_id", params.userId)
    .eq("status", "sent")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!session?.provider_reference || String(session.provider_reference).startsWith("pending:")) {
    return { ok: false, error: PHONE_VERIFY_COPY.invalidCode, status: 400 };
  }

  if (new Date(session.expires_at) < new Date()) {
    await admin
      .from("whatsapp_otp_sessions")
      .update({ status: "expired", consumed_at: new Date().toISOString() })
      .eq("id", session.id);
    return { ok: false, error: PHONE_VERIFY_COPY.expired, status: 400 };
  }

  if (session.verify_attempts >= MAX_VERIFY_ATTEMPTS) {
    return {
      ok: false,
      error: PHONE_VERIFY_COPY.maxAttempts,
      status: 429,
    };
  }

  const provider = getPhoneVerificationProvider();
  const confirmed = await provider.confirmOtp({
    reference: session.provider_reference,
    code,
  });

  if (!confirmed.ok) {
    await admin
      .from("whatsapp_otp_sessions")
      .update({ verify_attempts: session.verify_attempts + 1 })
      .eq("id", session.id);
    console.info("[phone-verification] verify failed", {
      sessionId: session.id,
      channel: session.channel,
      attempts: session.verify_attempts + 1,
    });
    return { ok: false, error: PHONE_VERIFY_COPY.invalidCode, status: 400 };
  }

  // Consume only after successful confirmation.
  const now = new Date().toISOString();
  await admin
    .from("whatsapp_otp_sessions")
    .update({ status: "verified", consumed_at: now })
    .eq("id", session.id);

  const { data: verifiedProfile } = await admin
    .from("profiles")
    .select("phone, whatsapp")
    .eq("id", params.userId)
    .maybeSingle();

  const phoneLocal =
    (session.phone_local as string | null) ||
    (verifiedProfile?.phone as string | null) ||
    (verifiedProfile?.whatsapp as string | null) ||
    "";
  const normalizedPhone = phoneLocal
    ? normalizePhoneForDuplicateCheck(phoneLocal)
    : null;

  // Phone Verified = true + timestamp (session consumed_at + profile fields).
  const phoneVerifiedPatch: Record<string, unknown> = {
    phone_verified: true,
    phone_verified_at: now,
    ...(phoneLocal
      ? {
          phone: phoneLocal,
          whatsapp: phoneLocal,
          normalized_phone: normalizedPhone,
        }
      : {}),
    // Keep WhatsApp badge in sync when the verified number is the contact line.
    whatsapp_verified_at: now,
    whatsapp_verification_status: "verified",
    whatsapp_verification_reference: null,
    whatsapp_verification_attempts: 0,
  };

  let { error: phonePatchError } = await admin
    .from("profiles")
    .update(phoneVerifiedPatch)
    .eq("id", params.userId);

  // Pre-migration fallback if phone_verified_at column is not yet applied.
  if (phonePatchError?.message?.includes("phone_verified_at")) {
    delete phoneVerifiedPatch.phone_verified_at;
    const retry = await admin
      .from("profiles")
      .update(phoneVerifiedPatch)
      .eq("id", params.userId);
    phonePatchError = retry.error;
  }

  if (phonePatchError) {
    console.error("[phone-verification] profile update failed", phonePatchError.message);
    return {
      ok: false,
      error: PHONE_VERIFY_COPY.providerUnavailable,
      status: 500,
    };
  }

  return {
    ok: true,
    message: PHONE_VERIFY_COPY.verified,
    phoneVerified: true,
    phoneVerifiedAt: now,
    phone: phoneLocal,
  };
}
