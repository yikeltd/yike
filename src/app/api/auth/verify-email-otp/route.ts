import { NextResponse } from "next/server";
import { createAuthEmailOtpDbClient } from "@/lib/auth-email-otp/rpc";
import { verifyAuthEmailOtp } from "@/lib/auth-email-otp/service";
import {
  isAuthEmailOtpPurpose,
  type AuthEmailOtpPurpose,
} from "@/lib/auth-email-otp/types";
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
    otp?: string;
    code?: string;
    purpose?: string;
    password?: string;
  };

  const email = String(body.email ?? "").trim();
  const code = String(body.otp ?? body.code ?? "").trim();
  const purposeRaw = String(body.purpose ?? "signup").trim();
  const purpose: AuthEmailOtpPurpose = isAuthEmailOtpPurpose(purposeRaw)
    ? purposeRaw
    : "email_verify";

  if (!email || code.length !== 6) {
    return NextResponse.json(
      { error: EMAIL_OTP_USER_MESSAGES.incorrect },
      { status: 400 }
    );
  }

  const result = await verifyAuthEmailOtp(db, {
    email,
    code,
    purpose,
    password: body.password,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    message: result.message,
    userId: result.userId,
  });
}
