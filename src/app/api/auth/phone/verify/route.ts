import { NextResponse } from "next/server";
import {
  isPhoneOtpEnabled,
  isWhatsappSignupOtpEnabled,
  phoneOtpDisabledPublicMessage,
} from "@/lib/feature-flags";
import { OTP_USER_MESSAGES } from "@/lib/notifications/messages";
import { verifyPhoneOtp } from "@/lib/otp";
import { createOtpDbClient } from "@/lib/otp/rpc";
import { normalizeNigerianPhone } from "@/lib/phone";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isPhoneOtpEnabled() && !isWhatsappSignupOtpEnabled()) {
    return NextResponse.json(
      { error: phoneOtpDisabledPublicMessage(), code: "phone_otp_disabled" },
      { status: 403 }
    );
  }

  const db = createOtpDbClient();
  if (!db) {
    return NextResponse.json({ error: OTP_USER_MESSAGES.unavailable }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const phone = normalizeNigerianPhone(String(body.phone ?? ""));
  const code = String(body.code ?? "").trim();

  if (!phone || code.length !== 6) {
    return NextResponse.json({ error: OTP_USER_MESSAGES.incorrect }, { status: 400 });
  }

  const result = await verifyPhoneOtp(db, phone, code);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    phoneVerificationToken: result.phoneVerificationToken,
    phone: result.phone,
  });
}
