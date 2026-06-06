import type { SupabaseClient } from "@supabase/supabase-js";
import {
  deliverOtp,
  isSendchampConfigured,
} from "@/lib/notifications/providers/sendchamp";
import { otpSentMessage, OTP_USER_MESSAGES } from "@/lib/notifications/messages";
import type { OtpChannel } from "@/lib/notifications/types";
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
  otpLatestRow,
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
      code?: "whatsapp_failed";
    };

export type VerifyOtpResult =
  | { ok: true; phoneVerificationToken: string; phone: string }
  | { ok: false; error: string; status: number };

function otpDb(): SupabaseClient | null {
  return createOtpDbClient();
}

export async function sendPhoneOtp(
  _admin: SupabaseClient | null,
  phone: string,
  preferredChannel?: OtpChannel
): Promise<SendOtpResult> {
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

  const recent = await otpLatestRow(db, phone);
  if (recent?.last_sent_at) {
    const elapsed = Date.now() - new Date(recent.last_sent_at).getTime();
    if (elapsed < OTP_RESEND_COOLDOWN_MS) {
      await otpLogEvent(db, { phone, channel, status: "cooldown" });
      return {
        ok: false,
        error: OTP_USER_MESSAGES.cooldown,
        status: 429,
      };
    }
  }

  if (!isSendchampConfigured()) {
    if (process.env.NODE_ENV === "development") {
      const code = generateOtp();
      console.info(`[Yike OTP dev] ${phone} (${channel}): ${code}`);
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString();
      const now = new Date().toISOString();
      await otpInsertPending(db, {
        phone,
        otpHash: hashOtp(code),
        expiresAt,
        channel,
        lastSentAt: now,
      });
      return {
        ok: true,
        channel,
        message: otpSentMessage(channel),
        devOtp: code,
      };
    }

    console.error("[otp] Sendchamp not configured");
    await otpLogEvent(db, {
      phone,
      channel,
      status: "failed",
      providerError: "Sendchamp not configured",
    });
    return {
      ok: false,
      error: OTP_USER_MESSAGES.sendFailed,
      status: 503,
    };
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString();
  const now = new Date().toISOString();

  const inserted = await otpInsertPending(db, {
    phone,
    otpHash: hashOtp(code),
    expiresAt,
    channel,
    lastSentAt: now,
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
    ...(process.env.NODE_ENV === "development" ? { devOtp: code } : {}),
  };
}

export async function verifyPhoneOtp(
  _admin: SupabaseClient | null,
  phone: string,
  code: string
): Promise<VerifyOtpResult> {
  const db = otpDb();
  if (!db) {
    return { ok: false, error: OTP_USER_MESSAGES.incorrect, status: 503 };
  }

  const row = await otpLatestRow(db, phone);

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
