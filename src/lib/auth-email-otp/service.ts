import type { SupabaseClient } from "@supabase/supabase-js";
import { buildEmailOtpHtml } from "@/lib/email/templates/email-otp";
import { isProductionEnv } from "@/lib/env";
import { isEmailOtpEnabled } from "@/lib/feature-flags";
import { EMAIL_OTP_USER_MESSAGES } from "@/lib/notifications/messages";
import {
  authOtpSubject,
  isResendConfigured,
  sendTransactionalEmail,
} from "@/lib/notifications/providers/resend";
import {
  OTP_EXPIRY_MS,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
} from "@/lib/otp/constants";
import { generateOtp, hashOtp, verifyOtpHash } from "@/lib/otp/crypto";
import { createVerifiedAdminClient } from "@/lib/supabase/admin";
import { finalizeSignupAfterOtp } from "./create-user";
import {
  authOtpConsume,
  authOtpIncrementAttempts,
  authOtpInsert,
  authOtpInvalidateActive,
  authOtpIpSendCountHour,
  authOtpLastSentAt,
  authOtpLatestActive,
  authOtpSendCountHour,
  emailConfirmUser,
  signupPendingGet,
} from "./rpc";
import type { AuthEmailOtpPurpose } from "./types";

const MAX_SENDS_PER_EMAIL_HOUR = 5;
const MAX_SENDS_PER_IP_HOUR = 20;
const SIGNUP_PENDING_MS = 30 * 60 * 1000;

export type SendAuthEmailOtpResult =
  | { ok: true; message: string; devOtp?: string }
  | { ok: false; error: string; status: number };

export type VerifyAuthEmailOtpResult =
  | { ok: true; message: string; userId?: string }
  | { ok: false; error: string; status: number };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function checkSendRateLimits(
  db: SupabaseClient,
  email: string,
  purpose: AuthEmailOtpPurpose,
  ipHash: string | null
): Promise<SendAuthEmailOtpResult | null> {
  const lastSentAt = await authOtpLastSentAt(db, email, purpose);
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

  const emailSends = await authOtpSendCountHour(db, email, purpose);
  if (emailSends >= MAX_SENDS_PER_EMAIL_HOUR) {
    return {
      ok: false,
      error: EMAIL_OTP_USER_MESSAGES.cooldown,
      status: 429,
    };
  }

  const ipSends = await authOtpIpSendCountHour(db, ipHash);
  if (ipSends >= MAX_SENDS_PER_IP_HOUR) {
    return {
      ok: false,
      error: EMAIL_OTP_USER_MESSAGES.cooldown,
      status: 429,
    };
  }

  return null;
}

export async function sendAuthEmailOtp(
  db: SupabaseClient,
  params: {
    email: string;
    purpose: AuthEmailOtpPurpose;
    fullName?: string;
    ipHash?: string | null;
    userAgentHash?: string | null;
  }
): Promise<SendAuthEmailOtpResult> {
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

  const rateLimited = await checkSendRateLimits(
    db,
    email,
    params.purpose,
    params.ipHash ?? null
  );
  if (rateLimited) return rateLimited;

  await authOtpInvalidateActive(db, email, params.purpose);

  const code = generateOtp();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS).toISOString();

  const insertedId = await authOtpInsert(db, {
    email,
    purpose: params.purpose,
    otpHash: hashOtp(code),
    expiresAt,
    ipHash: params.ipHash ?? null,
    userAgentHash: params.userAgentHash ?? null,
  });

  if (!insertedId) {
    console.error(
      "[auth-email-otp] OTP insert failed — check YIKE_OTP_SERVER_TOKEN, auth_email_otps RPC, and Supabase migration"
    );
    return { ok: false, error: EMAIL_OTP_USER_MESSAGES.sendFailed, status: 500 };
  }

  if (!isResendConfigured()) {
    if (!isProductionEnv()) {
      console.info(`[Yike auth email OTP dev] ${email} (${params.purpose}): ${code}`);
      return {
        ok: true,
        message: EMAIL_OTP_USER_MESSAGES.sent,
        devOtp: code,
      };
    }
    console.error(
      "[auth-email-otp] RESEND_API_KEY missing in production — set in Vercel env"
    );
    return { ok: false, error: EMAIL_OTP_USER_MESSAGES.sendFailed, status: 503 };
  }

  const result = await sendTransactionalEmail({
    to: email,
    subject: authOtpSubject(),
    html: buildEmailOtpHtml({
      fullName: params.fullName ?? "",
      code,
    }),
    idempotencyKey: `auth-email-otp/${params.purpose}/${email}/${Math.floor(now.getTime() / OTP_RESEND_COOLDOWN_MS)}`,
  });

  if (!result.ok) {
    console.error(
      "[auth-email-otp] Resend send failed:",
      result.error,
      "— check AUTH_EMAIL_FROM domain verification and RESEND_API_KEY"
    );
    if (!isProductionEnv()) {
      console.info(`[Yike auth email OTP dev fallback] ${email}: ${code}`);
      return {
        ok: true,
        message: EMAIL_OTP_USER_MESSAGES.sent,
        devOtp: code,
      };
    }
    return { ok: false, error: EMAIL_OTP_USER_MESSAGES.sendFailed, status: 502 };
  }

  return { ok: true, message: EMAIL_OTP_USER_MESSAGES.sent };
}

export async function verifyAuthEmailOtp(
  db: SupabaseClient,
  params: {
    email: string;
    code: string;
    purpose: AuthEmailOtpPurpose;
    password?: string;
  }
): Promise<VerifyAuthEmailOtpResult> {
  const email = normalizeEmail(params.email);
  const code = params.code.trim();

  if (!/^\d{6}$/.test(code)) {
    return { ok: false, error: EMAIL_OTP_USER_MESSAGES.incorrect, status: 400 };
  }

  const row = await authOtpLatestActive(db, email, params.purpose);
  if (!row) {
    return { ok: false, error: EMAIL_OTP_USER_MESSAGES.noCode, status: 400 };
  }

  if (new Date(row.expires_at) < new Date()) {
    return { ok: false, error: EMAIL_OTP_USER_MESSAGES.expired, status: 400 };
  }

  const maxAttempts = row.max_attempts ?? OTP_MAX_ATTEMPTS;
  if (row.attempts >= maxAttempts) {
    return { ok: false, error: EMAIL_OTP_USER_MESSAGES.maxAttempts, status: 429 };
  }

  if (!verifyOtpHash(code, row.otp_hash)) {
    const attempts = await authOtpIncrementAttempts(db, row.id);
    if (attempts >= maxAttempts) {
      return { ok: false, error: EMAIL_OTP_USER_MESSAGES.maxAttempts, status: 429 };
    }
    return { ok: false, error: EMAIL_OTP_USER_MESSAGES.incorrect, status: 400 };
  }

  await authOtpConsume(db, row.id);

  if (params.purpose === "signup") {
    const pending = await signupPendingGet(db, email);
    if (!pending) {
      return {
        ok: false,
        error: "Signup session expired. Please start again.",
        status: 400,
      };
    }

    if (new Date(pending.expires_at) < new Date()) {
      return {
        ok: false,
        error: "Signup session expired. Please start again.",
        status: 400,
      };
    }

    const password = String(params.password ?? "");
    if (password.length < 8) {
      return { ok: false, error: "Password is required to finish signup.", status: 400 };
    }

    const admin = await createVerifiedAdminClient();
    if (!admin) {
      return { ok: false, error: EMAIL_OTP_USER_MESSAGES.verifyFailed, status: 503 };
    }

    const finalized = await finalizeSignupAfterOtp(admin, db, pending, password);
    if (!finalized.ok) {
      return { ok: false, error: finalized.error, status: 400 };
    }

    return {
      ok: true,
      message: EMAIL_OTP_USER_MESSAGES.verified,
      userId: finalized.userId,
    };
  }

  const confirmed = await emailConfirmUser(db, email);
  if (!confirmed) {
    return { ok: false, error: EMAIL_OTP_USER_MESSAGES.verifyFailed, status: 500 };
  }

  return { ok: true, message: EMAIL_OTP_USER_MESSAGES.verified };
}

export { SIGNUP_PENDING_MS };
