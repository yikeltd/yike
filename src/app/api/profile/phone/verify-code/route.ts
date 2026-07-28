import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifySellerPhoneCode } from "@/lib/phone-verification";
import { recordVerification } from "@/lib/identity/service";
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
  const code = String(body.code ?? body.otp ?? "").trim();

  const result = await verifySellerPhoneCode(admin, {
    userId: user.id,
    code,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  // Update Yike Passport (Trust Identity) phone verification signal
  try {
    await recordVerification(user.id, "phone", "verified", "Sendchamp SMS OTP Verified");
    trackTransactionEvent("sms_otp_verified", { userId: user.id, metadata: { phone: result.phone } });
  } catch {
    // Non-blocking Passport record error
  }

  return NextResponse.json({
    ok: true,
    message: result.message,
    phoneVerified: true,
    phoneVerifiedAt: result.phoneVerifiedAt,
    phone: result.phone,
  });
}
