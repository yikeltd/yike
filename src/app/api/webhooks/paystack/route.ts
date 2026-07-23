import { NextResponse } from "next/server";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { isPaystackConfigured } from "@/lib/payments/config";
import {
  handlePaystackWebhook,
  type PaystackWebhookPayload,
} from "@/lib/payments/webhooks/paystack";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // Fail closed: do not acknowledge webhooks when payments are offline.
  if (!isPaystackConfigured()) {
    return NextResponse.json(
      { error: "Paystack not configured" },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  let payload: PaystackWebhookPayload = {};
  try {
    payload = rawBody ? (JSON.parse(rawBody) as PaystackWebhookPayload) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const admin = tryCreateAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  try {
    const result = await handlePaystackWebhook(admin, rawBody, payload, request.headers);
    if (!result.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({
      ok: true,
      duplicate: result.duplicate,
      fulfilled: result.fulfilled ?? false,
    });
  } catch (error) {
    console.error("[paystack webhook]", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
