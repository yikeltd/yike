import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getSafeHavenConfig,
  isSafeHavenWebhooksEnabled,
} from "@/lib/providers/safehaven/config";
import { verifySafeHavenWebhook } from "@/lib/providers/safehaven/client";
import {
  getSafeHavenWebhookHealth,
  handleSafeHavenWebhook,
} from "@/lib/providers/safehaven/webhook-handler";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getSafeHavenWebhookHealth());
}

export async function POST(request: Request) {
  if (!isSafeHavenWebhooksEnabled()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const rawBody = await request.text();
  let payload: unknown = {};
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const config = getSafeHavenConfig();
  const signatureConfigured = Boolean(config.webhookSecret);

  if (signatureConfigured) {
    const verified = verifySafeHavenWebhook(rawBody, request.headers);
    if (!verified.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: true, recorded: false });
  }

  const result = await handleSafeHavenWebhook(admin, {
    rawBody,
    payload,
    headers: request.headers,
    signatureVerified: signatureConfigured,
    signatureConfigured,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true, duplicate: result.duplicate });
}
