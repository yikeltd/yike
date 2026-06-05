import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeNigerianPhone } from "@/lib/phone";
import { generateVerificationToken, verifyOtp } from "@/lib/otp";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Auth service unavailable" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const phone = normalizeNigerianPhone(String(body.phone ?? ""));
  const code = String(body.code ?? "").trim();

  if (!phone || code.length !== 6) {
    return NextResponse.json({ error: "Phone and 6-digit code required" }, { status: 400 });
  }

  const { data: row } = await admin
    .from("phone_otp_requests")
    .select("id, otp_hash, expires_at, verified")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({ error: "No code sent for this number" }, { status: 400 });
  }

  if (row.verified) {
    return NextResponse.json({ error: "Code already used" }, { status: 400 });
  }

  if (new Date(row.expires_at) < new Date()) {
    return NextResponse.json({ error: "Code expired — request a new one" }, { status: 400 });
  }

  if (!verifyOtp(code, row.otp_hash)) {
    return NextResponse.json({ error: "Incorrect code" }, { status: 400 });
  }

  const token = generateVerificationToken();
  const { error } = await admin
    .from("phone_otp_requests")
    .update({ verified: true, verification_token: token })
    .eq("id", row.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    phoneVerificationToken: token,
    phone,
  });
}
