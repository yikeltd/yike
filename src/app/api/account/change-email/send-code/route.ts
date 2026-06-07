import { NextResponse } from "next/server";
import { createAuthEmailOtpDbClient } from "@/lib/auth-email-otp/rpc";
import { sendAuthEmailOtp } from "@/lib/auth-email-otp/service";
import { hashClientIp, hashUserAgent } from "@/lib/auth-email-otp/request-meta";
import { isEmailOtpEnabled } from "@/lib/feature-flags";
import { EMAIL_OTP_USER_MESSAGES } from "@/lib/notifications/messages";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isEmailOtpEnabled()) {
    return NextResponse.json(
      { error: EMAIL_OTP_USER_MESSAGES.unavailable },
      { status: 503 }
    );
  }

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

  const body = (await request.json().catch(() => ({}))) as { newEmail?: string };
  const newEmail = String(body.newEmail ?? "")
    .trim()
    .toLowerCase();

  if (!newEmail.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const currentEmail = user.email?.trim().toLowerCase();
  if (currentEmail && newEmail === currentEmail) {
    return NextResponse.json({ error: "That is already your email." }, { status: 400 });
  }

  const db = createAuthEmailOtpDbClient();
  if (!db) {
    return NextResponse.json(
      { error: EMAIL_OTP_USER_MESSAGES.unavailable },
      { status: 503 }
    );
  }

  const result = await sendAuthEmailOtp(db, {
    email: newEmail,
    purpose: "email_verify",
    ipHash: hashClientIp(request),
    userAgentHash: hashUserAgent(request),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, message: result.message });
}
