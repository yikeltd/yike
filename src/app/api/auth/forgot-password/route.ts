import { NextResponse } from "next/server";
import { resolveLoginEmail } from "@/lib/auth/credential-lookup";
import { createAuthEmailOtpDbClient } from "@/lib/auth-email-otp/rpc";
import { sendAuthEmailOtp } from "@/lib/auth-email-otp/service";
import { hashClientIp, hashUserAgent } from "@/lib/auth-email-otp/request-meta";
import { isEmailOtpEnabled } from "@/lib/feature-flags";
import { EMAIL_OTP_USER_MESSAGES } from "@/lib/notifications/messages";

export const runtime = "nodejs";

const GENERIC_MESSAGE =
  "If that account exists, we sent a reset code to the email on file.";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    identifier?: string;
    email?: string;
  };

  const identifier = String(body.identifier ?? body.email ?? "").trim();

  if (!identifier) {
    return NextResponse.json({ error: "Enter your email or username." }, { status: 400 });
  }

  if (!isEmailOtpEnabled()) {
    return NextResponse.json(
      { error: EMAIL_OTP_USER_MESSAGES.unavailable },
      { status: 503 }
    );
  }

  const email = await resolveLoginEmail(identifier);
  if (email) {
    const db = createAuthEmailOtpDbClient();
    if (db) {
      await sendAuthEmailOtp(db, {
        email,
        purpose: "password_reset",
        ipHash: hashClientIp(request),
        userAgentHash: hashUserAgent(request),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    message: GENERIC_MESSAGE,
    ...(email ? { email } : {}),
  });
}
