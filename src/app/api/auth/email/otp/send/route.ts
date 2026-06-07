import { NextResponse } from "next/server";
import { sendEmailOtp } from "@/lib/email-otp/service";
import { createEmailOtpDbClient } from "@/lib/email-otp/rpc";
import { isProductionEnv } from "@/lib/env";
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
    fullName?: string;
    userId?: string;
  };

  const email = String(body.email ?? "").trim();
  if (!email) {
    return NextResponse.json(
      { error: EMAIL_OTP_USER_MESSAGES.invalidEmail },
      { status: 400 }
    );
  }

  const result = await sendEmailOtp(db, {
    email,
    fullName: body.fullName,
    userId: body.userId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    message: result.message,
    ...(result.devOtp && !isProductionEnv() ? { devOtp: result.devOtp } : {}),
  });
}
