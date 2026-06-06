import { NextResponse } from "next/server";
import { sendEmailVerification } from "@/lib/email";
import { EMAIL_USER_MESSAGES } from "@/lib/notifications/messages";
import { createAdminClient, createVerifiedAdminClient } from "@/lib/supabase/admin";
import { createOtpDbClient, otpFindVerified } from "@/lib/otp/rpc";
import { normalizeNigerianPhone } from "@/lib/phone";
import { hashPin } from "@/lib/pin";
import { passwordPolicyError } from "@/lib/password-policy";
import { isReviewerAccountEmail } from "@/lib/reviewer-accounts";
import { validateMathChallenge } from "@/lib/signup-math-challenge";

export const runtime = "nodejs";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;

export async function POST(request: Request) {
  const admin = (await createVerifiedAdminClient()) ?? createAdminClient();
  if (!admin) {
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

  const { data: existingUsername } = await admin
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .maybeSingle();

  if (existingUsername) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  let pinHash: string;
  try {
    pinHash = hashPin(pin);
  } catch {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 400 });
  }

  const { data: authData, error: signUpError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: {
      full_name: fullName,
      phone,
      username,
    },
  });

  if (signUpError || !authData.user) {
    return NextResponse.json(
      { error: signUpError?.message ?? "Could not create account" },
      { status: 400 }
    );
  }

  const userId = authData.user.id;

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: fullName,
      username,
      email,
      phone,
      phone_verified: true,
      email_verified: false,
      pin_hash: pinHash,
      role: "user",
      verification_status: "not_started",
      whatsapp: phone,
    })
    .eq("id", userId);

  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const emailResult = await sendEmailVerification(admin, {
    email,
    fullName,
    userId,
  });

  if (!emailResult.ok) {
    return NextResponse.json(
      { error: emailResult.error },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    userId,
    message: EMAIL_USER_MESSAGES.verificationSent,
  });
}
