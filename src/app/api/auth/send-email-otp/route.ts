import { NextResponse } from "next/server";
import { hashClientIp, hashUserAgent } from "@/lib/auth-email-otp/request-meta";
import { createAuthEmailOtpDbClient } from "@/lib/auth-email-otp/rpc";
import { sendAuthEmailOtp } from "@/lib/auth-email-otp/service";
import {
  isAuthEmailOtpPurpose,
  type AuthEmailOtpPurpose,
} from "@/lib/auth-email-otp/types";
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

  const db = createAuthEmailOtpDbClient();
  if (!db) {
    return NextResponse.json(
      { error: EMAIL_OTP_USER_MESSAGES.unavailable },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    purpose?: string;
    fullName?: string;
  };

  const email = String(body.email ?? "").trim();
  const purposeRaw = String(body.purpose ?? "signup").trim();
  const purpose: AuthEmailOtpPurpose = isAuthEmailOtpPurpose(purposeRaw)
    ? purposeRaw
    : "email_verify";

  if (!email) {
    return NextResponse.json(
      { error: EMAIL_OTP_USER_MESSAGES.invalidEmail },
      { status: 400 }
    );
  }

  const result = await sendAuthEmailOtp(db, {
    email,
    purpose,
    fullName: body.fullName,
    ipHash: hashClientIp(request),
    userAgentHash: hashUserAgent(request),
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
