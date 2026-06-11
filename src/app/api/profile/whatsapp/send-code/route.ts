import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canRequestPhoneOtp, normalizeNigerianPhone } from "@/lib/phone";
import { sendWhatsappVerificationCode } from "@/lib/whatsapp-verification/service";
import { WHATSAPP_VERIFY_COPY } from "@/lib/whatsapp-verification/copy";
import { getWhatsappNumber } from "@/lib/whatsapp-verification/profile";

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
    return NextResponse.json(
      { error: "Enter a valid Nigerian WhatsApp number (e.g. 08035143299)." },
      { status: 400 }
    );
  }

  const result = await sendWhatsappVerificationCode(admin, {
    userId: user.id,
    phoneLocal,
    email: user.email ?? profile?.email,
    request,
    updateProfilePhone: true,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, ...(result.code ? { code: result.code } : {}) },
      { status: result.status }
    );
  }

  return NextResponse.json({
    ok: true,
    message: result.message,
    hint: WHATSAPP_VERIFY_COPY.beforeSend,
  });
}
