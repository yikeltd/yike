import { NextResponse } from "next/server";
import { hashClientIp, hashUserAgent } from "@/lib/auth-email-otp/request-meta";
import { createConfirmedAuthUser } from "@/lib/auth-email-otp/create-user";
import {
  createAuthEmailOtpDbClient,
  emailIsRegistered,
  signupPendingGet,
  signupPendingUpsert,
} from "@/lib/auth-email-otp/rpc";
import { sendAuthEmailOtp, SIGNUP_PENDING_MS } from "@/lib/auth-email-otp/service";
import {
  completeSignupProfile,
  confirmReviewerEmail,
  isUsernameAvailable,
} from "@/lib/auth/signup-rpc";
import { createOtpDbClient, otpFindVerified } from "@/lib/otp/rpc";
import { normalizeNigerianPhone } from "@/lib/phone";
import { hashPin } from "@/lib/pin";
import { passwordPolicyError } from "@/lib/password-policy";
import {
  isEmailOtpEnabled,
  isPhoneOtpEnabled,
} from "@/lib/feature-flags";
import { isReviewerAccountEmail } from "@/lib/reviewer-accounts";
import { validateMathChallenge } from "@/lib/signup-math-challenge";
import { isProductionEnv } from "@/lib/env";
import { EMAIL_OTP_USER_MESSAGES } from "@/lib/notifications/messages";
import { applyAmbassadorAttribution } from "@/lib/ambassador/attribution";
import { parseAmbassadorRefFromCookieHeader } from "@/lib/ambassador/cookie";
import { AUTH_USER_MESSAGES } from "@/constants/auth-messages";
import { createVerifiedAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;

export async function POST(request: Request) {
  const db = createAuthEmailOtpDbClient();
  if (!db) {
    return NextResponse.json(
      { error: AUTH_USER_MESSAGES.signupUnavailable },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const fullName = String(body.fullName ?? "").trim();
  const username = String(body.username ?? "").trim().toLowerCase();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phoneRaw = String(body.phone ?? "").trim();
  const phone = phoneRaw ? normalizeNigerianPhone(phoneRaw) : "";
  const password = String(body.password ?? "");
  const confirmPassword = String(body.confirmPassword ?? "");
  const pin = String(body.pin ?? "");
  const phoneVerificationToken = String(body.phoneVerificationToken ?? "").trim();
  const mathA = Number(body.mathA);
  const mathB = Number(body.mathB);
  const mathAnswer = Number(body.mathAnswer);

  if (!fullName || !username || !email || !password || !pin) {
    return NextResponse.json({ error: "All required fields must be filled in" }, { status: 400 });
  }

  if (!isEmailOtpEnabled()) {
    return NextResponse.json(
      { error: "Email sign-up is temporarily unavailable" },
      { status: 503 }
    );
  }

  if (!validateMathChallenge(mathA, mathB, mathAnswer)) {
    return NextResponse.json({ error: "Incorrect security check — try again" }, { status: 400 });
  }

  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: "Username: 3–24 letters, numbers, or underscores" },
      { status: 400 }
    );
  }

  const passwordError = passwordPolicyError(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be exactly 6 digits" }, { status: 400 });
  }

  const otpDb = createOtpDbClient();
  const reviewerBypass = isReviewerAccountEmail(email);
  const phoneOtpRequired = isPhoneOtpEnabled() && !reviewerBypass;

  if (phoneOtpRequired) {
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }
    const otpRow = otpDb
      ? await otpFindVerified(otpDb, phone, phoneVerificationToken)
      : null;

    if (!otpRow) {
      return NextResponse.json({ error: "Verify your phone number first" }, { status: 400 });
    }
  }

  const usernameFree = await isUsernameAvailable(username);
  if (usernameFree === null) {
    return NextResponse.json({ error: "Could not verify username" }, { status: 503 });
  }
  if (!usernameFree) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const pendingSignup = await signupPendingGet(db, email);
  const registeredEmail = await emailIsRegistered(db, email);
  if (registeredEmail === null) {
    console.error("[auth/signup] email registration check failed");
    return NextResponse.json(
      { error: AUTH_USER_MESSAGES.signupUnavailable },
      { status: 503 }
    );
  }

  if (registeredEmail && !pendingSignup) {
    return NextResponse.json(
      {
        error: "An account already exists with this email. Please sign in.",
        code: "account_exists",
      },
      { status: 409 }
    );
  }

  const resumeSignup = Boolean(pendingSignup);

  let pinHash: string;
  try {
    pinHash = hashPin(pin);
  } catch {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 400 });
  }

  if (reviewerBypass) {
    const admin = await createVerifiedAdminClient();
    if (!admin) {
      console.error("[auth/signup] verified Supabase admin client unavailable");
      return NextResponse.json(
        { error: AUTH_USER_MESSAGES.signupUnavailable },
        { status: 503 }
      );
    }

    const created = await createConfirmedAuthUser(admin, {
      email,
      password,
      fullName,
      phone,
      username,
    });

    if (!created.ok) {
      return NextResponse.json({ error: created.error }, { status: 400 });
    }

    const profileOk = await completeSignupProfile({
      userId: created.userId,
      username,
      pinHash,
      phone,
      fullName,
      phoneVerified: true,
    });

    if (!profileOk) {
      return NextResponse.json({ error: "Could not finish account setup" }, { status: 500 });
    }

    await confirmReviewerEmail(email);

    const referralCode = parseAmbassadorRefFromCookieHeader(request.headers.get("cookie"));
    if (referralCode) {
      await applyAmbassadorAttribution(admin, {
        userId: created.userId,
        referralCode,
        userEmail: email,
        userPhone: phone,
      });
    }

    return NextResponse.json({
      ok: true,
      userId: created.userId,
      needsEmailVerification: false,
      message: "Reviewer account ready — sign in with your password.",
    });
  }

  const pendingExpires = new Date(Date.now() + SIGNUP_PENDING_MS).toISOString();
  const pendingOk = await signupPendingUpsert(db, {
    email,
    username,
    fullName,
    phone,
    pinHash,
    phoneVerified: phoneOtpRequired,
    expiresAt: pendingExpires,
  });

  if (!pendingOk) {
    return NextResponse.json(
      { error: AUTH_USER_MESSAGES.signupUnavailable },
      { status: 503 }
    );
  }

  const otpResult = await sendAuthEmailOtp(db, {
    email,
    purpose: "signup",
    fullName,
    ipHash: hashClientIp(request),
    userAgentHash: hashUserAgent(request),
  });

  if (!otpResult.ok) {
    return NextResponse.json({ error: otpResult.error }, { status: otpResult.status });
  }

  return NextResponse.json({
    ok: true,
    needsEmailVerification: true,
    resume: resumeSignup,
    message: resumeSignup
      ? "Let's finish verifying your email."
      : EMAIL_OTP_USER_MESSAGES.sent,
    ...(!isProductionEnv() && otpResult.devOtp ? { devOtp: otpResult.devOtp } : {}),
  });
}
