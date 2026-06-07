import type { SupabaseClient } from "@supabase/supabase-js";
import {
  deliverOtp,
  getSendchampConfigSummary,
  isSendchampConfigured,
} from "@/lib/notifications/providers/sendchamp";
import { otpSentMessage, OTP_USER_MESSAGES } from "@/lib/notifications/messages";
import type { OtpChannel } from "@/lib/notifications/types";
import { isProductionEnv } from "@/lib/env";
import {
  isPhoneOtpEnabled,
  phoneOtpDisabledPublicMessage,
} from "@/lib/feature-flags";
import {
  OTP_EXPIRY_MS,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
} from "./constants";
import { generateOtp, generateVerificationToken, hashOtp, verifyOtpHash } from "./crypto";
import { sanitizeOtpError } from "./logs";
import {
  createOtpDbClient,
  otpIncrementAttempts,
  otpInsertPending,
  otpLastSentAt,
  otpLatestVerifiableRow,
  otpLogEvent,
  otpMarkExpired,
  otpMarkFailed,
  otpMarkSent,
  otpVerifySuccess,
} from "./rpc";

export type SendOtpResult =
  | { ok: true; channel: OtpChannel; message: string; devOtp?: string }
  | {
      ok: false;
      error: string;
      status: number;
      code?: "whatsapp_failed" | "phone_otp_disabled";
    };

export type VerifyOtpResult =
  | { ok: true; phoneVerificationToken: string; phone: string }
  | { ok: false; error: string; status: number };

function otpDb(): SupabaseClient | null {
  return createOtpDbClient();
}

async function checkCooldown(
  db: SupabaseClient,
  phone: string,
  channel: OtpChannel
): Promise<SendOtpResult | null> {
  const lastSentAt = await otpLastSentAt(db, phone);
  if (!lastSentAt) return null;

  const elapsed = Date.now() - new Date(lastSentAt).getTime();
  if (elapsed < OTP_RESEND_COOLDOWN_MS) {
    await otpLogEvent(db, { phone, channel, status: "cooldown" });
    return {
      ok: false,
      error: OTP_USER_MESSAGES.cooldown,
      status: 429,
    };
  }
  return null;
}

async function devFallbackSend(
  db: SupabaseClient,
  phone: string,
  channel: OtpChannel,
  reason: string
): Promise<SendOtpResult> {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString();

  const inserted = await otpInsertPending(db, {
    phone,
    otpHash: hashOtp(code),
    expiresAt,
    channel,
  });

  if (!inserted) {
    return { ok: false, error: OTP_USER_MESSAGES.sendFailed, status: 500 };
  }

  await otpMarkSent(db, inserted.id, channel);
  await otpLogEvent(db, {
    phone,
    channel,
    status: "sent",
    expiresAt,
    providerError: `dev_fallback: ${reason}`,
  });

  console.info(`[Yike OTP dev fallback] ${phone} (${channel}): ${code} — ${reason}`);

  return {
    ok: true,
    channel,
    message: otpSentMessage(channel),
    devOtp: code,
  };
}

export async function sendPhoneOtp(
  _admin: SupabaseClient | null,
  phone: string,
  preferredChannel?: OtpChannel
): Promise<SendOtpResult> {
  if (!isPhoneOtpEnabled()) {
    return {
      ok: false,
      error: phoneOtpDisabledPublicMessage(),
      status: 403,
      code: "phone_otp_disabled",
    };
  }

  const db = otpDb();
  if (!db) {
    console.error("[otp] OTP database client unavailable");
    return {
      ok: false,
      error: OTP_USER_MESSAGES.sendFailed,
      status: 503,
    };
  }

  const channel: OtpChannel = preferredChannel ?? "whatsapp";

  const cooldown = await checkCooldown(db, phone, channel);
  if (cooldown) return cooldown;

  if (!isSendchampConfigured()) {
    const sendchamp = getSendchampConfigSummary();
    const envHint =
      sendchamp.configured === false && sendchamp.supabaseKeyRejected
        ? "Sendchamp API key looks like a Supabase key — fix SENDCHAMP_PUBLIC_KEY in Vercel"
        : "Sendchamp not configured";

    if (!isProductionEnv()) {
      return devFallbackSend(db, phone, channel, envHint);
    }

    console.error("[otp]", envHint);
    await otpLogEvent(db, {
      phone,
      channel,
      status: "failed",
      providerError: envHint,
    });
    return {
      ok: false,
      error: OTP_USER_MESSAGES.sendFailed,
      status: 503,
    };
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString();

  const inserted = await otpInsertPending(db, {
    phone,
    otpHash: hashOtp(code),
    expiresAt,
    channel,
  });

  if (!inserted) {
    return {
      ok: false,
      error: OTP_USER_MESSAGES.sendFailed,
      status: 500,
    };
  }

  const delivered = await deliverOtp(phone, code, preferredChannel);

  if (!delivered.ok) {
    const sanitized = sanitizeOtpError(delivered.error);
    console.error("[otp] send failed", phone, preferredChannel, delivered.error);

    if (!isProductionEnv()) {
      await otpMarkSent(db, inserted.id, channel);
      await otpLogEvent(db, {
        phone,
        channel,
        status: "sent",
        expiresAt,
        providerError: `dev_fallback: ${delivered.error ?? "provider_failed"}`,
      });
      console.info(
        `[Yike OTP dev fallback] ${phone} (${channel}): ${code} — ${delivered.error ?? "provider_failed"}`
      );
      return {
        ok: true,
        channel,
        message: otpSentMessage(channel),
        devOtp: code,
      };
    }

    await otpMarkFailed(db, inserted.id, sanitized);
    await otpLogEvent(db, {
      phone,
      channel,
      status: "failed",
      expiresAt,
      providerError: delivered.error,
    });

    if (preferredChannel === "whatsapp") {
      return {
        ok: false,
        error: OTP_USER_MESSAGES.whatsappFailed,
        status: 502,
        code: "whatsapp_failed",
      };
    }

    return {
      ok: false,
      error: OTP_USER_MESSAGES.sendFailed,
      status: 502,
    };
  }

  const sentChannel = delivered.data!.channel;
  const providerReference = delivered.data!.reference;

  await otpMarkSent(db, inserted.id, sentChannel, providerReference);
  await otpLogEvent(db, {
    phone,
    channel: sentChannel,
    status: "sent",
    expiresAt,
  });

  return {
    ok: true,
    channel: sentChannel,
    message: otpSentMessage(sentChannel),
  };
}

export async function verifyPhoneOtp(
  _admin: SupabaseClient | null,
  phone: string,
  code: string
): Promise<VerifyOtpResult> {
  if (!isPhoneOtpEnabled()) {
    return {
      ok: false,
      error: phoneOtpDisabledPublicMessage(),
      status: 403,
    };
  }

  const db = otpDb();
  if (!db) {
    return { ok: false, error: OTP_USER_MESSAGES.incorrect, status: 503 };
  }

  const row = await otpLatestVerifiableRow(db, phone);

  if (!row) {
    return { ok: false, error: OTP_USER_MESSAGES.incorrect, status: 400 };
  }

  if (row.verified) {
    return { ok: false, error: OTP_USER_MESSAGES.alreadyUsed, status: 400 };
  }

  if (new Date(row.expires_at) < new Date()) {
    await otpMarkExpired(db, row.id);
    await otpLogEvent(db, {
      phone,
      channel: row.channel ?? "sms",
      status: "expired",
      attempts: row.attempts,
      expiresAt: row.expires_at,
    });
    return { ok: false, error: OTP_USER_MESSAGES.expired, status: 400 };
  }

  if (row.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, error: OTP_USER_MESSAGES.maxAttempts, status: 429 };
  }

  if (!verifyOtpHash(code, row.otp_hash)) {
    const attempts = (await otpIncrementAttempts(db, row.id)) ?? row.attempts + 1;
    await otpLogEvent(db, {
      phone,
      channel: row.channel ?? "sms",
      status: "failed",
      attempts,
      expiresAt: row.expires_at,
    });
    return { ok: false, error: OTP_USER_MESSAGES.incorrect, status: 400 };
  }

  const token = generateVerificationToken();
  const ok = await otpVerifySuccess(db, row.id, token);
  if (!ok) {
    return { ok: false, error: OTP_USER_MESSAGES.incorrect, status: 500 };
  }

  await otpLogEvent(db, {
    phone,
    channel: row.channel ?? "sms",
    status: "verified",
    attempts: row.attempts,
    expiresAt: row.expires_at,
  });

  return { ok: true, phoneVerificationToken: token, phone };
}
