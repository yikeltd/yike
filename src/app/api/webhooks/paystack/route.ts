import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPaystackConfigured } from "@/lib/payments/config";
import {
  handlePaystackWebhook,
  type PaystackWebhookPayload,
} from "@/lib/payments/webhooks/paystack";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isPaystackConfigured()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const rawBody = await request.text();
  let payload: PaystackWebhookPayload = {};
  try {
    payload = rawBody ? (JSON.parse(rawBody) as PaystackWebhookPayload) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: true, recorded: false });
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
    const message = error instanceof Error ? error.message : "Webhook failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
