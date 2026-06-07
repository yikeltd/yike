import { NextResponse } from "next/server";
import {
  getSendchampConfigSummary,
  isSendchampConfigured,
  runSendchampDiagnostics,
} from "@/lib/notifications/providers/sendchamp";
import { createOtpDbClient } from "@/lib/otp/rpc";
import { probeSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function authorized(request: Request): boolean {
  const token = process.env.YIKE_OTP_SERVER_TOKEN?.trim();
  if (!token) return false;
  const header =
    request.headers.get("x-yike-otp-token") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return header === token;
}

/** Ops probe: Sendchamp wiring on the running deployment (YIKE_OTP_SERVER_TOKEN). */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sendchamp = getSendchampConfigSummary();
  const supabaseAdmin = await probeSupabaseAdmin();
  const diagnostics = isSendchampConfigured()
    ? await runSendchampDiagnostics()
    : [{ step: "config", ok: false, error: "Sendchamp not configured" }];

  return NextResponse.json({
    ok:
      supabaseAdmin.ok &&
      isSendchampConfigured() &&
      !(sendchamp.configured && sendchamp.envWarnings?.length) &&
      diagnostics.some((step) => step.ok),
    otpRpcConfigured: Boolean(createOtpDbClient()),
    supabaseAdmin,
    sendchamp,
    diagnostics,
  });
}
