import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/constants";
import {
  completeSignupProfile,
  confirmReviewerEmail,
  isUsernameAvailable,
} from "@/lib/auth/signup-rpc";
import { sendEmailVerification } from "@/lib/email";
import { EMAIL_USER_MESSAGES } from "@/lib/notifications/messages";
import { createOtpDbClient, otpFindVerified } from "@/lib/otp/rpc";
import { normalizeNigerianPhone } from "@/lib/phone";
import { hashPin } from "@/lib/pin";
import { passwordPolicyError } from "@/lib/password-policy";
import { isReviewerAccountEmail } from "@/lib/reviewer-accounts";
import { validateMathChallenge } from "@/lib/signup-math-challenge";
import { createVerifiedAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";

export const runtime = "nodejs";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;

export async function POST(request: Request) {
  const supabase = createPublicClient();
  if (!supabase) {
    return NextResponse.json({ error: "Auth service unavailable" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const fullName = String(body.fullName ?? "").trim();
  const username = String(body.username ?? "").trim().toLowerCase();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = normalizeNigerianPhone(String(body.phone ?? ""));
  const password = String(body.password ?? "");
  const confirmPassword = String(body.confirmPassword ?? "");
  const pin = String(body.pin ?? "");
  const phoneVerificationToken = String(body.phoneVerificationToken ?? "");
  const mathA = Number(body.mathA);
  const mathB = Number(body.mathB);
  const mathAnswer = Number(body.mathAnswer);

  if (!fullName || !username || !email || !phone || !password || !pin) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
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

  if (!reviewerBypass) {
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

  let pinHash: string;
  try {
    pinHash = hashPin(pin);
  } catch {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 400 });
  }

  const redirectTo = `${SITE_URL}/auth/callback?next=${encodeURIComponent("/auth/verify-email")}`;
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        username,
      },
      emailRedirectTo: redirectTo,
    },
  });

  if (signUpError) {
    const message = signUpError.message.includes("already registered")
      ? "An account with this email already exists"
      : signUpError.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!authData.user) {
    return NextResponse.json({ error: "Could not create account" }, { status: 400 });
  }

  const userId = authData.user.id;

  const profileOk = await completeSignupProfile({
    userId,
    username,
    pinHash,
    phone,
    fullName,
    phoneVerified: true,
  });

  if (!profileOk) {
    return NextResponse.json({ error: "Could not finish account setup" }, { status: 500 });
  }

  if (reviewerBypass) {
    const confirmed = await confirmReviewerEmail(email);
    if (!confirmed) {
      console.error("[auth/signup] reviewer email confirm failed:", email);
    }
  }

  const admin = await createVerifiedAdminClient();
  if (admin) {
    const emailResult = await sendEmailVerification(admin, {
      email,
      fullName,
      userId,
    });
    if (!emailResult.ok) {
      console.warn("[auth/signup] verification email skipped:", emailResult.error);
    }
  }

  return NextResponse.json({
    ok: true,
    userId,
    message: reviewerBypass
      ? "Reviewer account ready — sign in with your password."
      : EMAIL_USER_MESSAGES.verificationSent,
  });
}
