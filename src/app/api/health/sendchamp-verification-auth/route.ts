import { NextResponse } from "next/server";
import { isProductionEnv } from "@/lib/env";
import { isRealSmsTestEnabled } from "@/lib/phone-verification/real-sms-test";
import {
  getSendchampVerificationAuthDiagnostic,
  probeSendchampVerificationAuth,
} from "@/lib/notifications/providers/sendchamp-auth-probe";

export const runtime = "nodejs";

/** Local real-SMS debugging — safe config + auth probe (no secrets, no outbound SMS). */
export async function GET() {
  if (isProductionEnv()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  if (!isRealSmsTestEnabled()) {
    return NextResponse.json(
      {
        error: "Enable YIKE_REAL_SMS_TEST=true in .env.local and restart dev server.",
      },
      { status: 403 }
    );
  }

  const config = getSendchampVerificationAuthDiagnostic();
  const probe = await probeSendchampVerificationAuth();

  return NextResponse.json({
    ok: probe.failureCategory === "ok",
    config,
    probe,
  });
}
