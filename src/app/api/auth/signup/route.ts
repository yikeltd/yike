import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeNigerianPhone } from "@/lib/phone";
import { hashPin } from "@/lib/pin";

export const runtime = "nodejs";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;

export async function POST(request: Request) {
  const admin = createAdminClient();
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

  if (!fullName || !username || !email || !phone || !password || !pin) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: "Username: 3–24 letters, numbers, or underscores" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be exactly 6 digits" }, { status: 400 });
  }

  const { data: otpRow } = await admin
    .from("phone_otp_requests")
    .select("id, verified, verification_token")
    .eq("phone", phone)
    .eq("verified", true)
    .eq("verification_token", phoneVerificationToken)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!otpRow) {
    return NextResponse.json({ error: "Verify your phone number first" }, { status: 400 });
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

  await admin.auth.resend({ type: "signup", email });

  return NextResponse.json({
    ok: true,
    userId,
    message: "Account created. Check your email to verify your account.",
  });
}
