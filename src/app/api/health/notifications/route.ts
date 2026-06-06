import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isResendConfigured } from "@/lib/notifications/providers/resend";
import {
  isSendchampConfigured,
  probeSendchampConnection,
  resolveWhatsAppSender,
} from "@/lib/notifications/providers/sendchamp";

export const runtime = "nodejs";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  return request.headers.get("x-cron-secret") === secret;
}

/** Ops-only: verify notification env wiring on the running deployment. */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const sendchampProbe = isSendchampConfigured()
    ? await probeSendchampConnection()
    : null;

  return NextResponse.json({
    ok: true,
    supabase: {
      url: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
      anonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
      serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
      adminClient: Boolean(admin),
    },
    sendchamp: {
      configured: isSendchampConfigured(),
      smsSender: process.env.SENDCHAMP_SMS_SENDER?.trim() || "Sendchamp",
      whatsappSenderEnv: process.env.SENDCHAMP_WHATSAPP_SENDER?.trim() || null,
      whatsappSenderResolved: resolveWhatsAppSender(
        process.env.SENDCHAMP_WHATSAPP_SENDER?.trim()
      ),
      keySources: [
        process.env.SENDCHAMP_API_KEY?.trim() ? "SENDCHAMP_API_KEY" : null,
        process.env.SENDCHAMP_SECRET_KEY?.trim() ? "SENDCHAMP_SECRET_KEY" : null,
        process.env.SENDCHAMP_PUBLIC_KEY?.trim() ? "SENDCHAMP_PUBLIC_KEY" : null,
      ].filter(Boolean),
      probe: sendchampProbe
        ? sendchampProbe.ok
          ? { ok: true, message: sendchampProbe.data?.message }
          : { ok: false, error: sendchampProbe.error }
        : null,
    },
    resend: {
      configured: isResendConfigured(),
      from: process.env.RESEND_FROM_EMAIL?.trim() || null,
    },
    appUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || null,
  });
}
