import { NextResponse } from "next/server";
import {
  handleSendchampWebhook,
  parseSendchampWebhook,
} from "@/lib/notifications/providers/sendchamp-webhook";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Fail closed: missing webhook secret rejects all POSTs.
 * Never accept unauthenticated delivery callbacks in any environment.
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env.SENDCHAMP_WEBHOOK_SECRET?.trim();
  if (!secret) return false;

  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  if (querySecret && querySecret === secret) return true;

  const headerSecret =
    request.headers.get("x-yike-webhook-secret") ??
    request.headers.get("x-sendchamp-webhook-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  return Boolean(headerSecret) && headerSecret === secret;
}

/** Health check for Sendchamp dashboard URL verification. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "sendchamp-webhook",
    url: "https://yike.ng/api/webhooks/sendchamp",
  });
}

export async function POST(request: Request) {
  if (!process.env.SENDCHAMP_WEBHOOK_SECRET?.trim()) {
    console.error(
      "[Sendchamp webhook] SENDCHAMP_WEBHOOK_SECRET is not set — rejecting (fail closed)",
    );
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 503 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const payload = parseSendchampWebhook(body);

  if (payload) {
    const admin = createAdminClient();
    if (admin) {
      try {
        await handleSendchampWebhook(admin, payload);
      } catch (err) {
        console.error("[Sendchamp webhook] handler error", err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
