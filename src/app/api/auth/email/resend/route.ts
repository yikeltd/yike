import { NextResponse } from "next/server";
import { hashClientIp, hashUserAgent } from "@/lib/auth-email-otp/request-meta";
import { createAuthEmailOtpDbClient } from "@/lib/auth-email-otp/rpc";
import { sendAuthEmailOtp } from "@/lib/auth-email-otp/service";
import { EMAIL_OTP_USER_MESSAGES } from "@/lib/notifications/messages";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: EMAIL_OTP_USER_MESSAGES.sendFailed }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const db = createAuthEmailOtpDbClient();
  if (!db) {
    return NextResponse.json({ error: EMAIL_OTP_USER_MESSAGES.unavailable }, { status: 503 });
  }

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle()
      .then((r) => r.data?.full_name)) ??
    "";

  const result = await sendAuthEmailOtp(db, {
    email: user.email,
    purpose: "email_verify",
    fullName,
    ipHash: hashClientIp(request),
    userAgentHash: hashUserAgent(request),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, message: EMAIL_OTP_USER_MESSAGES.sent });
}
