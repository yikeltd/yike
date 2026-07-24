import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifySellerPhoneCode } from "@/lib/phone-verification";

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

  return NextResponse.json({
    ok: true,
    message: result.message,
    phoneVerified: true,
    phoneVerifiedAt: result.phoneVerifiedAt,
    phone: result.phone,
  });
}
