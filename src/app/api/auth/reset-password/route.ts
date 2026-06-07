import { NextResponse } from "next/server";
import { createAuthEmailOtpDbClient } from "@/lib/auth-email-otp/rpc";
import { verifyAuthEmailOtp } from "@/lib/auth-email-otp/service";
import { logAuthSecurityEvent } from "@/lib/auth/security-events";
import { getRequestMeta } from "@/lib/auth/session-state";
import { isEmailOtpEnabled } from "@/lib/feature-flags";
import { EMAIL_OTP_USER_MESSAGES } from "@/lib/notifications/messages";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isEmailOtpEnabled()) {
    return NextResponse.json(
      { error: EMAIL_OTP_USER_MESSAGES.unavailable },
      { status: 503 }
    );
  }

  const db = createAuthEmailOtpDbClient();
  if (!db) {
    return NextResponse.json(
      { error: EMAIL_OTP_USER_MESSAGES.unavailable },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    code?: string;
    otp?: string;
    password?: string;
    newPassword?: string;
  };

  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const code = String(body.code ?? body.otp ?? "").trim();
  const password = String(body.newPassword ?? body.password ?? "");

  if (!email.includes("@") || code.length !== 6) {
    return NextResponse.json({ error: "Enter your email and 6-digit code." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Choose a password with at least 8 characters." },
      { status: 400 }
    );
  }

  const result = await verifyAuthEmailOtp(db, {
    email,
    code,
    purpose: "password_reset",
    password,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { ip, userAgent } = await getRequestMeta(request);
  await logAuthSecurityEvent({
    userId: result.userId,
    eventType: "password_change.confirmed",
    metadata: { via: "password_reset" },
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true, message: result.message });
}
