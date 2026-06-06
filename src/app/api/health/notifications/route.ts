import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isResendConfigured } from "@/lib/notifications/providers/resend";
import { getSendchampConfigSummary } from "@/lib/notifications/providers/sendchamp";

export const runtime = "nodejs";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const header =
    request.headers.get("x-cron-secret") ?? request.headers.get("x-vercel-cron-secret");
  return header === secret;
}

/** Ops-only: verify notification env wiring on the running deployment. */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  let supabaseAdminConfigured = false;
  if (admin) {
    const { error } = await admin.from("phone_otp_requests").select("id").limit(1);
    supabaseAdminConfigured = !error;
    if (error) {
      console.error("[health/notifications] supabase admin query failed", error.message);
    }
  }

  const sendchamp = getSendchampConfigSummary();

  return NextResponse.json({
    ok: true,
    supabaseAdminConfigured,
    yikeOtpServerTokenConfigured: Boolean(process.env.YIKE_OTP_SERVER_TOKEN?.trim()),
    yikeOtpRpcConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() &&
        process.env.YIKE_OTP_SERVER_TOKEN?.trim()
    ),
    sendchampPublicKeyConfigured: sendchamp.publicKeyConfigured ?? false,
    sendchampBaseUrlConfigured:
      sendchamp.baseUrlConfigured ?? Boolean(process.env.SENDCHAMP_LIVE_BASE_URL?.trim()),
    sendchampConfigured: sendchamp.configured,
    smsSenderConfigured: sendchamp.configured
      ? sendchamp.smsSenderConfigured
      : Boolean(process.env.SENDCHAMP_SMS_SENDER?.trim()),
    whatsappSenderConfigured: sendchamp.configured
      ? sendchamp.whatsappSenderConfigured
      : Boolean(process.env.SENDCHAMP_WHATSAPP_SENDER?.trim()),
    resendConfigured: isResendConfigured(),
  });
}
