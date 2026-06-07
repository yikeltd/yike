import { NextResponse } from "next/server";
import { createAuthEmailOtpDbClient } from "@/lib/auth-email-otp/rpc";
import { parseAmbassadorRefFromCookieHeader } from "@/lib/ambassador/cookie";
import { verifyAuthEmailOtp } from "@/lib/auth-email-otp/service";
import { isEmailOtpEnabled } from "@/lib/feature-flags";
import { EMAIL_OTP_USER_MESSAGES } from "@/lib/notifications/messages";

export const runtime = "nodejs";

/** @deprecated Use POST /api/auth/verify-email-otp */
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
    password?: string;
    purpose?: string;
  };

  const email = String(body.email ?? "").trim();
  const code = String(body.code ?? "").trim();
  const purpose =
    body.purpose === "login" || body.purpose === "email_verify"
      ? body.purpose
      : "signup";

  if (!email || code.length !== 6) {
    return NextResponse.json(
      { error: EMAIL_OTP_USER_MESSAGES.incorrect },
      { status: 400 }
    );
  }

  const referralCode = parseAmbassadorRefFromCookieHeader(request.headers.get("cookie"));

  const result = await verifyAuthEmailOtp(db, {
    email,
    code,
    purpose,
    password: body.password,
    referralCode,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, message: EMAIL_OTP_USER_MESSAGES.verified });
}
