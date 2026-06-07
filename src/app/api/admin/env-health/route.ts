import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { isEmailOtpEnabled, isWebAuthnEnabled } from "@/lib/feature-flags";
import { getPinPepper } from "@/lib/pin";
import { isResendConfigured } from "@/lib/notifications/providers/resend";
import {
  transactionalFromAddress,
  transactionalFromDomain,
} from "@/lib/email/from-address";
import { COMPANY_EMAIL } from "@/lib/constants";
import { createAuthEmailOtpDbClient } from "@/lib/auth-email-otp/rpc";
import { probeSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabaseProbe = await probeSupabaseAdmin();
  const otpDb = createAuthEmailOtpDbClient();

  const resolvedFrom = transactionalFromAddress();
  const fromUsesHello = resolvedFrom.toLowerCase().includes(COMPANY_EMAIL);

  const envChecks = {
    RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY?.trim()),
    AUTH_EMAIL_FROM: fromUsesHello,
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
    CRON_SECRET: Boolean(process.env.CRON_SECRET?.trim()),
    YIKE_PIN_PEPPER: Boolean(getPinPepper()),
    ENABLE_WEBAUTHN: isWebAuthnEnabled(),
  };

  const emailSenderConfigured = isResendConfigured() && fromUsesHello;
  const otpRouteReady =
    isEmailOtpEnabled() && Boolean(otpDb) && envChecks.RESEND_API_KEY && emailSenderConfigured;

  const allRequiredPresent = Object.values(envChecks).every(Boolean);

  return NextResponse.json({
    ok: allRequiredPresent && supabaseProbe.ok && otpRouteReady,
    env: Object.fromEntries(
      Object.entries(envChecks).map(([key, present]) => [key, present ? "present" : "missing"])
    ),
    emailSenderConfigured,
    otpRouteReady,
    emailOtpEnabled: isEmailOtpEnabled(),
    resendConfigured: isResendConfigured(),
    supabaseServiceRole: supabaseProbe,
    supabaseAdminAuth: supabaseProbe.authAdminReachable ? "OK" : "Failed",
    profilesQuery: supabaseProbe.profilesReachable ? "OK" : "Failed",
    authEmailFromDomain: transactionalFromDomain(),
    transactionalFrom: resolvedFrom,
    pinPepperConfigured: envChecks.YIKE_PIN_PEPPER,
    webAuthnEnabled: envChecks.ENABLE_WEBAUTHN,
  });
}
