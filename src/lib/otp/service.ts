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
  OTP_PROVIDER,
  OTP_RESEND_COOLDOWN_MS,
} from "./constants";
import { generateOtp, generateVerificationToken, hashOtp, verifyOtpHash } from "./crypto";
import { logOtpEvent } from "./logs";

type OtpRow = {
  id: string;
  otp_hash: string;
  expires_at: string;
  verified: boolean;
  attempts: number;
  last_sent_at: string | null;
  channel: OtpChannel | null;
};

export type SendOtpResult =
  | { ok: true; channel: OtpChannel; message: string; devOtp?: string }
  | { ok: false; error: string; status: number };

export type VerifyOtpResult =
  | { ok: true; phoneVerificationToken: string; phone: string }
  | { ok: false; error: string; status: number };

async function latestOtpRow(
  admin: SupabaseClient,
  phone: string
): Promise<OtpRow | null> {
  const { data } = await admin
    .from("phone_otp_requests")
    .select("id, otp_hash, expires_at, verified, attempts, last_sent_at, channel")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as OtpRow | null;
}

export async function sendPhoneOtp(
  admin: SupabaseClient,
  phone: string,
  preferredChannel?: OtpChannel
): Promise<SendOtpResult> {
  const recent = await latestOtpRow(admin, phone);
  if (recent?.last_sent_at) {
    const elapsed = Date.now() - new Date(recent.last_sent_at).getTime();
    if (elapsed < OTP_RESEND_COOLDOWN_MS) {
      await logOtpEvent(admin, {
        phone,
        channel: preferredChannel ?? "whatsapp",
        status: "cooldown",
      });
      return {
        ok: false,
        error: OTP_USER_MESSAGES.cooldown,
        status: 429,
      };
    }
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString();
  const now = new Date().toISOString();

  let channel: OtpChannel = preferredChannel ?? "whatsapp";
  let providerReference: string | undefined;

  if (isSendchampConfigured()) {
    const delivered = await deliverOtp(phone, code, preferredChannel);
    if (!delivered.ok) {
      console.error("[otp] send failed", phone, preferredChannel, delivered.error);
      await logOtpEvent(admin, {
        phone,
        channel: preferredChannel ?? "whatsapp",
        status: "failed",
        expiresAt,
        providerError: delivered.error,
      });
      return {
        ok: false,
        error: OTP_USER_MESSAGES.sendFailed,
        status: 502,
      };
    }
    channel = delivered.data!.channel;
    providerReference = delivered.data!.reference;
  } else if (process.env.NODE_ENV === "development") {
    console.info(`[Yike OTP dev] ${phone} (${channel}): ${code}`);
  } else {
    await logOtpEvent(admin, {
      phone,
      channel,
      status: "failed",
      expiresAt,
    });
    return {
      ok: false,
      error: OTP_USER_MESSAGES.sendFailed,
      status: 503,
    };
  }

  const { error } = await admin.from("phone_otp_requests").insert({
    phone,
    otp_hash: hashOtp(code),
    expires_at: expiresAt,
    attempts: 0,
    channel,
    provider: OTP_PROVIDER,
    provider_reference: providerReference ?? null,
    last_sent_at: now,
  });

  if (error) {
    return { ok: false, error: OTP_USER_MESSAGES.sendFailed, status: 500 };
  }

  await logOtpEvent(admin, {
    phone,
    channel,
    status: "sent",
    expiresAt,
  });

  return {
    ok: true,
    channel,
    message: otpSentMessage(channel),
    ...(process.env.NODE_ENV === "development" ? { devOtp: code } : {}),
  };
}

export async function verifyPhoneOtp(
  admin: SupabaseClient,
  phone: string,
  code: string
): Promise<VerifyOtpResult> {
  const row = await latestOtpRow(admin, phone);

  if (!row) {
    return { ok: false, error: OTP_USER_MESSAGES.noCode, status: 400 };
  }

  if (row.verified) {
    return { ok: false, error: OTP_USER_MESSAGES.alreadyUsed, status: 400 };
  }

  if (new Date(row.expires_at) < new Date()) {
    await logOtpEvent(admin, {
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
    const attempts = row.attempts + 1;
    await admin.from("phone_otp_requests").update({ attempts }).eq("id", row.id);
    await logOtpEvent(admin, {
      phone,
      channel: row.channel ?? "sms",
      status: "failed",
      attempts,
      expiresAt: row.expires_at,
    });
    return { ok: false, error: OTP_USER_MESSAGES.incorrect, status: 400 };
  }

  const token = generateVerificationToken();
  const { error } = await admin
    .from("phone_otp_requests")
    .update({ verified: true, verification_token: token })
    .eq("id", row.id);

  if (error) {
    return { ok: false, error: OTP_USER_MESSAGES.sendFailed, status: 500 };
  }

  await logOtpEvent(admin, {
    phone,
    channel: row.channel ?? "sms",
    status: "verified",
    attempts: row.attempts,
    expiresAt: row.expires_at,
  });

  return { ok: true, phoneVerificationToken: token, phone };
}
