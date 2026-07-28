import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canRequestPhoneOtp, normalizeNigerianPhone } from "@/lib/phone";
import {
  PHONE_VERIFY_COPY,
  sendSellerPhoneVerificationCode,
} from "@/lib/phone-verification";
import { getWhatsappNumber } from "@/lib/whatsapp-verification/profile";
import { trackTransactionEvent } from "@/lib/analytics/index";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const phoneRaw = String(body.phone ?? body.whatsapp ?? "").trim();

  const { data: profile } = await admin
    .from("profiles")
    .select("whatsapp, phone, email")
    .eq("id", user.id)
    .maybeSingle();

  const phoneLocal = normalizeNigerianPhone(
    phoneRaw || getWhatsappNumber(profile ?? {}) || ""
  );

  if (!canRequestPhoneOtp(phoneLocal)) {
    return NextResponse.json({ error: PHONE_VERIFY_COPY.invalidPhone }, { status: 400 });
  }

  const result = await sendSellerPhoneVerificationCode(admin, {
    userId: user.id,
    phoneLocal,
    email: user.email ?? profile?.email,
    request,
    updateProfilePhone: true,
    channel: "sms",
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, ...(result.code ? { code: result.code } : {}) },
      { status: result.status }
    );
  }

  trackTransactionEvent("sms_otp_sent", { userId: user.id, metadata: { channel: result.channel } });

  return NextResponse.json({
    ok: true,
    channel: result.channel,
    message: result.message,
    expiresMinutes: result.expiresMinutes,
    ...(result.bypass
      ? {
          bypass: true,
          phoneVerified: true,
          phoneVerifiedAt: result.phoneVerifiedAt,
          phone: result.phone,
        }
      : {}),
  });
}
