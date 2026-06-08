import type { SupabaseClient } from "@supabase/supabase-js";
import { buildEmailOtpHtml } from "@/lib/email/templates/email-otp";
import { finalizeTransactionalEmailHtml } from "@/lib/email/finalize-html";
import { createAdminClient } from "@/lib/supabase/admin";
import { isProductionEnv } from "@/lib/env";
import { isEmailOtpEnabled } from "@/lib/feature-flags";
import { EMAIL_OTP_USER_MESSAGES } from "@/lib/notifications/messages";
import {
  emailSubjectForType,
  isResendConfigured,
  sendTransactionalEmail,
} from "@/lib/notifications/providers/resend";
import {
  OTP_EXPIRY_MS,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
} from "@/lib/otp/constants";
import { generateOtp, hashOtp, verifyOtpHash } from "@/lib/otp/crypto";
import {
  emailConfirmUser,
  emailOtpIncrementAttempts,
  emailOtpInsertPending,
  emailOtpLastSentAt,
  emailOtpLatestVerifiable,
  emailOtpMarkSent,
  emailOtpVerifySuccess,
} from "./rpc";

export type SendEmailOtpResult =
  | { ok: true; message: string; devOtp?: string }
  | { ok: false; error: string; status: number };

export type VerifyEmailOtpResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function sendEmailOtp(
  db: SupabaseClient,
  params: { email: string; fullName?: string; userId?: string | null }
): Promise<SendEmailOtpResult> {
  if (!isEmailOtpEnabled()) {
    return {
      ok: false,
      error: EMAIL_OTP_USER_MESSAGES.unavailable,
      status: 503,
    };
  }

  const email = normalizeEmail(params.email);
  if (!email.includes("@")) {
    return { ok: false, error: EMAIL_OTP_USER_MESSAGES.invalidEmail, status: 400 };
  }

  const lastSentAt = await emailOtpLastSentAt(db, email);
  if (lastSentAt) {
    const elapsed = Date.now() - new Date(lastSentAt).getTime();
    if (elapsed < OTP_RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        error: EMAIL_OTP_USER_MESSAGES.cooldown,
        status: 429,
      };
    }
  }

  const code = generateOtp();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS).toISOString();

  const insertedId = await emailOtpInsertPending(db, {
    email,
    otpHash: hashOtp(code),
    expiresAt,
    userId: params.userId,
    lastSentAt: now.toISOString(),
  });

  if (!insertedId) {
    return { ok: false, error: EMAIL_OTP_USER_MESSAGES.sendFailed, status: 500 };
  }

  if (!isResendConfigured()) {
    if (!isProductionEnv()) {
      await emailOtpMarkSent(db, insertedId);
      console.info(`[Yike email OTP dev] ${email}: ${code}`);
      return {
        ok: true,
        message: EMAIL_OTP_USER_MESSAGES.sent,
        devOtp: code,
      };
    }
    return { ok: false, error: EMAIL_OTP_USER_MESSAGES.sendFailed, status: 503 };
  }

  const html = await finalizeTransactionalEmailHtml(
    buildEmailOtpHtml({
      fullName: params.fullName ?? "",
      code,
      purpose: "signup",
    }),
    { admin: createAdminClient() ?? db }
  );

  const result = await sendTransactionalEmail({
    to: email,
    subject: emailSubjectForType("email_verification"),
    html,
    idempotencyKey: `email-otp/${email}/${Math.floor(now.getTime() / OTP_RESEND_COOLDOWN_MS)}`,
  });

  if (!result.ok) {
    if (!isProductionEnv()) {
      await emailOtpMarkSent(db, insertedId);
      console.info(`[Yike email OTP dev fallback] ${email}: ${code}`);
      return {
        ok: true,
        message: EMAIL_OTP_USER_MESSAGES.sent,
        devOtp: code,
      };
    }
    return { ok: false, error: EMAIL_OTP_USER_MESSAGES.sendFailed, status: 502 };
  }

  await emailOtpMarkSent(db, insertedId);
  return { ok: true, message: EMAIL_OTP_USER_MESSAGES.sent };
}

export async function verifyEmailOtp(
  db: SupabaseClient,
  email: string,
  code: string
): Promise<VerifyEmailOtpResult> {
  const normalized = normalizeEmail(email);
  if (!/^\d{6}$/.test(code)) {
    return { ok: false, error: EMAIL_OTP_USER_MESSAGES.incorrect, status: 400 };
  }

  const row = await emailOtpLatestVerifiable(db, normalized);
  if (!row) {
    return { ok: false, error: EMAIL_OTP_USER_MESSAGES.noCode, status: 400 };
  }

  if (new Date(row.expires_at) < new Date()) {
    return { ok: false, error: EMAIL_OTP_USER_MESSAGES.expired, status: 400 };
  }

  if (row.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, error: EMAIL_OTP_USER_MESSAGES.maxAttempts, status: 429 };
  }

  if (!verifyOtpHash(code, row.otp_hash)) {
    const attempts = await emailOtpIncrementAttempts(db, row.id);
    if (attempts >= OTP_MAX_ATTEMPTS) {
      return { ok: false, error: EMAIL_OTP_USER_MESSAGES.maxAttempts, status: 429 };
    }
    return { ok: false, error: EMAIL_OTP_USER_MESSAGES.incorrect, status: 400 };
  }

  await emailOtpVerifySuccess(db, row.id);
  const confirmed = await emailConfirmUser(db, normalized);
  if (!confirmed) {
    return { ok: false, error: EMAIL_OTP_USER_MESSAGES.verifyFailed, status: 500 };
  }

  return { ok: true };
}
