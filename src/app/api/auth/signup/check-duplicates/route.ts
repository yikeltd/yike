import { NextResponse } from "next/server";
import { createAuthEmailOtpDbClient } from "@/lib/auth-email-otp/rpc";
import { normalizePhoneForDuplicateCheck } from "@/lib/phone";

export const runtime = "nodejs";

function otpServerToken(): string | null {
  return process.env.YIKE_OTP_SERVER_TOKEN?.trim() || null;
}

export async function POST(request: Request) {
  const token = otpServerToken();
  const db = createAuthEmailOtpDbClient();
  if (!token || !db) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const phoneRaw = String(body.phone ?? "").trim();
  const normalizedPhone = phoneRaw ? normalizePhoneForDuplicateCheck(phoneRaw) : null;

  const { data, error } = await db.rpc("yike_check_signup_duplicates", {
    p_token: token,
    p_email: email || null,
    p_phone: normalizedPhone ? phoneRaw : null,
  });

  if (error) {
    console.error("[auth/signup/check-duplicates]", error.message);
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const row = (data ?? {}) as { emailExists?: boolean; phoneExists?: boolean };

  return NextResponse.json({
    emailExists: Boolean(row.emailExists),
    phoneExists: Boolean(row.phoneExists),
  });
}
