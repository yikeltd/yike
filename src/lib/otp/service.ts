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
import { logOtpEvent, sanitizeOtpError } from "./logs";

type OtpRow = {
  id: string;
  otp_hash: string;
  expires_at: string;
  verified: boolean;
  attempts: number;
  last_sent_at: string | null;
  channel: OtpChannel | null;
  status: string | null;
};

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

async function latestOtpRow(
  admin: SupabaseClient,
  phone: string
): Promise<OtpRow | null> {
  const { data } = await admin
    .from("phone_otp_requests")
    .select(
      "id, otp_hash, expires_at, verified, attempts, last_sent_at, channel, status"
    )
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
  const channel: OtpChannel = preferredChannel ?? "whatsapp";

  const recent = await latestOtpRow(admin, phone);
  if (recent?.last_sent_at) {
    const elapsed = Date.now() - new Date(recent.last_sent_at).getTime();
    if (elapsed < OTP_RESEND_COOLDOWN_MS) {
      await logOtpEvent(admin, {
        phone,
        channel,
        status: "cooldown",
      });
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
      await admin.from("phone_otp_requests").insert({
        phone,
        otp_hash: hashOtp(code),
        expires_at: expiresAt,
        attempts: 0,
        channel,
        provider: OTP_PROVIDER,
        status: "sent",
        last_sent_at: now,
      });
      return {
        ok: true,
        channel,
        message: otpSentMessage(channel),
        devOtp: code,
      };
    }

    console.error("[otp] Sendchamp not configured");
    await logOtpEvent(admin, {
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

  const { data: inserted, error: insertError } = await admin
    .from("phone_otp_requests")
    .insert({
      phone,
      otp_hash: hashOtp(code),
      expires_at: expiresAt,
      attempts: 0,
      channel,
      provider: OTP_PROVIDER,
      status: "pending",
      last_sent_at: now,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("[otp] insert failed", phone, insertError?.message);
    try {
      await logOtpEvent(admin, {
        phone,
        channel,
        status: "failed",
        expiresAt,
        providerError: insertError?.message ?? "database_insert_failed",
      });
    } catch (logErr) {
      console.error("[otp] log insert failed", logErr);
    }
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
    await admin
      .from("phone_otp_requests")
      .update({
        status: "failed",
        error_message: sanitized,
      })
      .eq("id", inserted.id);
    await logOtpEvent(admin, {
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

  const { error: updateError } = await admin
    .from("phone_otp_requests")
    .update({
      channel: sentChannel,
      status: "sent",
      provider_reference: providerReference ?? null,
      error_message: null,
    })
    .eq("id", inserted.id);

  if (updateError) {
    console.error("[otp] status update failed", phone, updateError.message);
  }

  await logOtpEvent(admin, {
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
  admin: SupabaseClient,
  phone: string,
  code: string
): Promise<VerifyOtpResult> {
  const row = await latestOtpRow(admin, phone);

  if (!row) {
    return { ok: false, error: OTP_USER_MESSAGES.incorrect, status: 400 };
  }

  if (row.verified) {
    return { ok: false, error: OTP_USER_MESSAGES.alreadyUsed, status: 400 };
  }

  if (new Date(row.expires_at) < new Date()) {
    await admin
      .from("phone_otp_requests")
      .update({ status: "expired" })
      .eq("id", row.id);
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
  const verifiedAt = new Date().toISOString();
  const { error } = await admin
    .from("phone_otp_requests")
    .update({
      verified: true,
      verification_token: token,
      status: "verified",
      verified_at: verifiedAt,
    })
    .eq("id", row.id);

  if (error) {
    console.error("[otp] verify update failed", phone, error.message);
    return { ok: false, error: OTP_USER_MESSAGES.incorrect, status: 500 };
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
