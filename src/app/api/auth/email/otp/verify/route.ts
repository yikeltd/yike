import { NextResponse } from "next/server";
import { verifyEmailOtp } from "@/lib/email-otp/service";
import { createEmailOtpDbClient } from "@/lib/email-otp/rpc";
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

  const db = createEmailOtpDbClient();
  if (!db) {
    return NextResponse.json(
      { error: EMAIL_OTP_USER_MESSAGES.unavailable },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    code?: string;
  };

  const email = String(body.email ?? "").trim();
  const code = String(body.code ?? "").trim();

  if (!email || code.length !== 6) {
    return NextResponse.json(
      { error: EMAIL_OTP_USER_MESSAGES.incorrect },
      { status: 400 }
    );
  }

  const result = await verifyEmailOtp(db, email, code);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, message: EMAIL_OTP_USER_MESSAGES.verified });
}
