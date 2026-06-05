import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canRequestPhoneOtp, normalizeNigerianPhone } from "@/lib/phone";
import { generateOtp, hashOtp } from "@/lib/otp";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Auth service unavailable" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const phone = normalizeNigerianPhone(String(body.phone ?? ""));

  if (!canRequestPhoneOtp(phone)) {
    return NextResponse.json(
      { error: "Enter a valid 11-digit Nigerian number (070, 080, 081, 090, 091)" },
      { status: 400 }
    );
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error } = await admin.from("phone_otp_requests").insert({
    phone,
    otp_hash: hashOtp(otp),
    expires_at: expiresAt,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // TODO: integrate WhatsApp/SMS provider — for now log in development
  if (process.env.NODE_ENV === "development") {
    console.info(`[Yike OTP] ${phone}: ${otp}`);
  }

  return NextResponse.json({
    ok: true,
    message: "Verification code sent via WhatsApp/SMS",
    ...(process.env.NODE_ENV === "development" ? { devOtp: otp } : {}),
  });
}
