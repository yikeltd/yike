import { NextResponse } from "next/server";
import { buildStandardHealthPayload } from "@/lib/deploy-metadata";
import { createAuthEmailOtpDbClient } from "@/lib/auth-email-otp/rpc";
import { getSupabaseAdminConfig } from "@/lib/supabase/admin";
import { isEmailOtpEnabled } from "@/lib/feature-flags";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  let serviceRolePresent = false;
  try {
    serviceRolePresent = getSupabaseAdminConfig().serviceRolePresent;
  } catch {
    serviceRolePresent = false;
  }

  const otpToken = Boolean(process.env.YIKE_OTP_SERVER_TOKEN?.trim());
  const otpDb = Boolean(createAuthEmailOtpDbClient());
  const signupReady =
    isEmailOtpEnabled() && otpToken && serviceRolePresent && otpDb;

  return NextResponse.json(
    buildStandardHealthPayload({
      application: "yike",
      status: signupReady ? "ok" : "degraded",
      database: "skipped",
      diagnostics: {
        signupReady,
        emailOtpEnabled: isEmailOtpEnabled(),
        yikeOtpServerToken: otpToken,
        supabaseServiceRole: serviceRolePresent,
        otpDbClient: otpDb,
        vehicleMarketplace: isLaunchFeatureVisible("vehicle_marketplace"),
      },
    }),
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
