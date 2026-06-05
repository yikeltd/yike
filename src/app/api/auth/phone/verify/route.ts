import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OTP_USER_MESSAGES } from "@/lib/notifications/messages";
import { verifyPhoneOtp } from "@/lib/otp";
import { normalizeNigerianPhone } from "@/lib/phone";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: OTP_USER_MESSAGES.unavailable }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const phone = normalizeNigerianPhone(String(body.phone ?? ""));
  const code = String(body.code ?? "").trim();

  if (!phone || code.length !== 6) {
    return NextResponse.json({ error: OTP_USER_MESSAGES.incorrect }, { status: 400 });
  }

  const result = await verifyPhoneOtp(admin, phone, code);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    phoneVerificationToken: result.phoneVerificationToken,
    phone: result.phone,
  });
}
