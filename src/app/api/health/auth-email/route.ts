import { NextResponse } from "next/server";
import { createAuthEmailOtpDbClient } from "@/lib/auth-email-otp/rpc";
import { isResendConfigured } from "@/lib/notifications/providers/resend";
import { transactionalFromAddress } from "@/lib/email/from-address";
import { COMPANY_EMAIL } from "@/lib/constants";
import { isEmailOtpEnabled } from "@/lib/feature-flags";
import { probeSupabaseAdmin } from "@/lib/supabase/admin";

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

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseProbe = await probeSupabaseAdmin();
  const otpDb = createAuthEmailOtpDbClient();
  const resolvedFrom = transactionalFromAddress();
  const fromUsesHello = resolvedFrom.toLowerCase().includes(COMPANY_EMAIL);
  const resendKey = Boolean(process.env.RESEND_API_KEY?.trim());
  const otpToken = Boolean(process.env.YIKE_OTP_SERVER_TOKEN?.trim());
  const serviceRole = supabaseProbe.serviceRolePresent;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";

  const otpDbReady = Boolean(otpDb) && (serviceRole || otpToken);

  return NextResponse.json({
    ok:
      isEmailOtpEnabled() &&
      otpDbReady &&
      resendKey &&
      fromUsesHello &&
      supabaseProbe.ok,
    emailOtpEnabled: isEmailOtpEnabled(),
    otpRpcClient: Boolean(otpDb),
    supabaseServiceRole: serviceRole,
    supabaseServiceRoleSource: supabaseProbe.serviceRoleSource,
    standardSupabaseServiceRole: supabaseProbe.standardServiceRolePresent,
    yikeOtpServerToken: otpToken,
    resendApiKey: resendKey,
    authEmailFrom: fromUsesHello,
    transactionalFrom: resolvedFrom,
    siteUrl: siteUrl || null,
    siteUrlIsProduction: siteUrl.includes("yike.ng"),
    supabaseAdmin: supabaseProbe,
    resendConfigured: isResendConfigured(),
  });
}
