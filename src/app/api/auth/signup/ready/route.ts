import { NextResponse } from "next/server";
import { createAuthEmailOtpDbClient } from "@/lib/auth-email-otp/rpc";
import { isEmailOtpEnabled } from "@/lib/feature-flags";
import { getSupabaseAdminConfig } from "@/lib/supabase/admin";
import { isResendConfigured } from "@/lib/notifications/providers/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public signup readiness probe — booleans only, no secrets.
 * Used to diagnose production "We could not start signup" without staff auth.
 */
export async function GET() {
  let serviceRolePresent = false;
  let supabaseUrlPresent = false;
  try {
    const cfg = getSupabaseAdminConfig();
    serviceRolePresent = cfg.serviceRolePresent;
    supabaseUrlPresent = cfg.supabaseUrlPresent;
  } catch {
    serviceRolePresent = false;
  }

  const otpServerToken = Boolean(process.env.YIKE_OTP_SERVER_TOKEN?.trim());
  const otpDbClient = Boolean(createAuthEmailOtpDbClient());
  const emailOtpEnabled = isEmailOtpEnabled();
  const resendConfigured = isResendConfigured();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || null;

  const ready =
    emailOtpEnabled &&
    otpServerToken &&
    serviceRolePresent &&
    supabaseUrlPresent &&
    otpDbClient;

  return NextResponse.json(
    {
      ready,
      status: ready ? "ok" : "degraded",
      checks: {
        emailOtpEnabled,
        yikeOtpServerToken: otpServerToken,
        supabaseUrl: supabaseUrlPresent,
        supabaseServiceRole: serviceRolePresent,
        otpDbClient,
        resendConfigured,
        siteUrlConfigured: Boolean(siteUrl),
        siteUrlLooksProduction: Boolean(siteUrl?.includes("yike.ng")),
      },
      hint: ready
        ? null
        : "Signup dependencies missing — check Coolify server env (OTP token, Supabase service role, site URL).",
    },
    {
      status: ready ? 200 : 503,
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}
