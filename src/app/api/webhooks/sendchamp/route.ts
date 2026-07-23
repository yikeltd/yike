import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import {
  handleSendchampWebhook,
  parseSendchampWebhook,
} from "@/lib/notifications/providers/sendchamp-webhook";
import { tryCreateAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function secretsEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  try {
    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

/**
 * Fail closed: missing webhook secret rejects all POSTs.
 * Never accept unauthenticated delivery callbacks in any environment.
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env.SENDCHAMP_WEBHOOK_SECRET?.trim();
  if (!secret) return false;

  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  if (querySecret && secretsEqual(querySecret, secret)) return true;

  const headerSecret =
    request.headers.get("x-yike-webhook-secret") ??
    request.headers.get("x-sendchamp-webhook-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (headerSecret && secretsEqual(headerSecret, secret)) return true;
  return false;
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
    const admin = tryCreateAdminClient();
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
