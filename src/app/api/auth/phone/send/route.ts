import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OTP_USER_MESSAGES } from "@/lib/notifications/messages";
import type { OtpChannel } from "@/lib/notifications/types";
import { sendPhoneOtp } from "@/lib/otp";
import { canRequestPhoneOtp, normalizeNigerianPhone } from "@/lib/phone";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: OTP_USER_MESSAGES.unavailable }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const phone = normalizeNigerianPhone(String(body.phone ?? ""));
  const preferred: OtpChannel | undefined =
    body.channel === "whatsapp" ? "whatsapp" : body.channel === "sms" ? "sms" : undefined;

  if (!canRequestPhoneOtp(phone)) {
    return NextResponse.json({ error: OTP_USER_MESSAGES.invalidPhone }, { status: 400 });
  }

  const result = await sendPhoneOtp(admin, phone, preferred);

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
    ...(result.devOtp ? { devOtp: result.devOtp } : {}),
  });
}
