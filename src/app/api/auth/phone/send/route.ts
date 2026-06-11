import { NextResponse } from "next/server";
import {
  isPhoneOtpEnabled,
  isWhatsappSignupOtpEnabled,
  phoneOtpDisabledPublicMessage,
} from "@/lib/feature-flags";
import { WHATSAPP_VERIFY_COPY } from "@/lib/whatsapp-verification/copy";
import { isProductionEnv } from "@/lib/env";
import { OTP_USER_MESSAGES } from "@/lib/notifications/messages";
import type { OtpChannel } from "@/lib/notifications/types";
import { sendPhoneOtp } from "@/lib/otp";
import { createOtpDbClient } from "@/lib/otp/rpc";
import { canRequestPhoneOtp, normalizeNigerianPhone } from "@/lib/phone";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const phone = normalizeNigerianPhone(String(body.phone ?? ""));
  const preferred: OtpChannel | undefined =
    body.channel === "whatsapp" ? "whatsapp" : body.channel === "sms" ? "sms" : undefined;

  const whatsappOnlySignup =
    preferred === "whatsapp" && isWhatsappSignupOtpEnabled() && !isPhoneOtpEnabled();

  if (!isPhoneOtpEnabled() && !whatsappOnlySignup) {
    return NextResponse.json(
      {
        error: phoneOtpDisabledPublicMessage(),
        code: "phone_otp_disabled",
      },
      { status: 403 }
    );
  }

  const db = createOtpDbClient();
  if (!db) {
    return NextResponse.json({ error: OTP_USER_MESSAGES.unavailable }, { status: 503 });
  }

  if (!canRequestPhoneOtp(phone)) {
    return NextResponse.json({ error: OTP_USER_MESSAGES.invalidPhone }, { status: 400 });
  }

  const result = await sendPhoneOtp(db, phone, preferred);

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        ...(result.code ? { code: result.code } : {}),
      },
      { status: result.status }
    );
  }

  return NextResponse.json({
    ok: true,
    channel: result.channel,
    message: result.message,
    ...(whatsappOnlySignup ? { hint: WHATSAPP_VERIFY_COPY.beforeSend } : {}),
    ...(result.devOtp && !isProductionEnv() ? { devOtp: result.devOtp } : {}),
  });
}
