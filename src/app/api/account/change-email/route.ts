import { NextResponse } from "next/server";
import { createAuthEmailOtpDbClient } from "@/lib/auth-email-otp/rpc";
import { authOtpConsume, authOtpLatestActive, authOtpIncrementAttempts } from "@/lib/auth-email-otp/rpc";
import { logAuthSecurityEvent } from "@/lib/auth/security-events";
import {
  parseSensitiveConfirmationToken,
  requireSensitiveConfirmation,
} from "@/lib/auth/require-sensitive-confirmation";
import { getRequestMeta } from "@/lib/auth/session-state";
import { verifyOtpHash } from "@/lib/otp/crypto";
import { OTP_MAX_ATTEMPTS } from "@/lib/otp/constants";
import { createClient } from "@/lib/supabase/server";
import { createVerifiedAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const gate = requireSensitiveConfirmation(
    parseSensitiveConfirmationToken(body),
    user.id,
    "change_email"
  );
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  const newEmail = String(body.newEmail ?? "")
    .trim()
    .toLowerCase();
  const code = String(body.code ?? "").trim();

  if (!newEmail.includes("@") || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Enter your new email and the 6-digit code." }, { status: 400 });
  }

  const db = createAuthEmailOtpDbClient();
  if (!db) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const row = await authOtpLatestActive(db, newEmail, "email_verify");
  if (!row) {
    return NextResponse.json({ error: "Code expired or not found. Request a new one." }, { status: 400 });
  }

  if (new Date(row.expires_at) < new Date()) {
    return NextResponse.json({ error: "Code expired. Request a new one." }, { status: 400 });
  }

  const maxAttempts = row.max_attempts ?? OTP_MAX_ATTEMPTS;
  if (row.attempts >= maxAttempts) {
    return NextResponse.json({ error: "Too many attempts. Request a new code." }, { status: 429 });
  }

  if (!verifyOtpHash(code, row.otp_hash)) {
    const attempts = await authOtpIncrementAttempts(db, row.id);
    if (attempts >= maxAttempts) {
      return NextResponse.json({ error: "Too many attempts. Request a new code." }, { status: 429 });
    }
    return NextResponse.json({ error: "Incorrect code. Try again." }, { status: 400 });
  }

  await authOtpConsume(db, row.id);

  const admin = await createVerifiedAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const { data: taken } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", newEmail)
    .neq("id", user.id)
    .maybeSingle();

  if (taken) {
    return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
  }

  const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
    email: newEmail,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  await admin
    .from("profiles")
    .update({ email: newEmail, email_verified: true })
    .eq("id", user.id);

  const { ip, userAgent } = await getRequestMeta(request);
  await logAuthSecurityEvent({
    userId: user.id,
    eventType: "email_change.confirmed",
    metadata: { newEmail },
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true, message: "Email updated." });
}
