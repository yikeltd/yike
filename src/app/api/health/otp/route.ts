import { NextResponse } from "next/server";
import { createVerifiedAdminClient, probeSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getSendchampConfigSummary,
  isSendchampConfigured,
  runSendchampDiagnostics,
} from "@/lib/notifications/providers/sendchamp";

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

/** Ops-only: Sendchamp + Supabase OTP wiring self-test (no user OTP sent). */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseProbe = await probeSupabaseAdmin();
  const admin = await createVerifiedAdminClient();
  let phoneOtpRequestsReachable = false;
  if (admin) {
    const { error } = await admin.from("phone_otp_requests").select("id").limit(1);
    phoneOtpRequestsReachable = !error;
    if (error) {
      console.error("[health/otp] phone_otp_requests query failed", error.message);
    }
  }
  const supabaseAdminConfigured = supabaseProbe.ok && phoneOtpRequestsReachable;

  const sendchamp = getSendchampConfigSummary();
  const diagnostics = isSendchampConfigured()
    ? await runSendchampDiagnostics()
    : [{ step: "config", ok: false, error: "Sendchamp not configured" }];

  return NextResponse.json({
    ok: supabaseAdminConfigured && sendchamp.configured,
    supabaseAdminConfigured,
    supabaseAdmin: supabaseProbe,
    phoneOtpRequestsReachable,
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
    diagnostics,
  });
}
