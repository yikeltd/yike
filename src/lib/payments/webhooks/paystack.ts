import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isPaystackConfigured } from "@/lib/payments/config";
import { paystackProvider } from "@/lib/payments/providers/paystack";
import { reconcileAndFulfillPayment } from "@/lib/payments/services/payment-service";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { recordPaystackWebhookEvent } from "@/lib/payments/webhooks/paystack-events";

export { recordPaystackWebhookEvent } from "@/lib/payments/webhooks/paystack-events";

export type PaystackWebhookPayload = {
  event?: string;
  data?: {
    reference?: string;
    id?: number | string;
    status?: string;
    amount?: number;
    currency?: string;
  };
};

function logPaystackWebhook(
  level: "info" | "warn",
  message: string,
  meta: Record<string, unknown>
): void {
  const entry = { ...meta };
  if (level === "warn") {
    console.warn(`[paystack webhook] ${message}`, entry);
  } else {
    console.info(`[paystack webhook] ${message}`, entry);
  }
}

/**
 * Paystack webhook handler.
 * Critical: signature verify → gateway verify → idempotent SUCCESS → fulfill.
 * Never activate from callback URL or unsigned webhook body alone.
 */
export async function handlePaystackWebhook(
  admin: SupabaseClient,
  rawBody: string,
  payload: PaystackWebhookPayload,
  headers: Headers
): Promise<{ ok: boolean; duplicate: boolean; fulfilled?: boolean; reason?: string }> {
  if (!paystackProvider.isConfigured()) {
    return { ok: false, duplicate: false, reason: "not_configured" };
  }

  const signatureOk = paystackProvider.verifyWebhookSignature?.(rawBody, headers);
  if (signatureOk !== true) {
    logPaystackWebhook("warn", "invalid signature", {
      hasSignature: Boolean(headers.get("x-paystack-signature")?.trim()),
    });
    return { ok: false, duplicate: false, reason: "invalid_signature" };
  }

  const eventType = payload.event ?? null;
  const reference = payload.data?.reference?.trim() ?? null;
  const eventId =
    payload.data?.id != null
      ? String(payload.data.id)
      : reference
        ? `${eventType ?? "event"}:${reference}`
        : null;

  const recorded = await recordPaystackWebhookEvent(admin, {
    eventId,
    eventType,
    reference,
    payload,
  });

  if (recorded.duplicate) {
    logPaystackWebhook("info", "duplicate delivery", { eventType, reference, eventId });
    return { ok: true, duplicate: true };
  }

  if (!reference || !eventType?.startsWith("charge.")) {
    if (recorded.id) {
      await admin
        .from("paystack_webhook_events")
        .update({ status: "processed", processed_at: new Date().toISOString() })
        .eq("id", recorded.id);
    }
    logPaystackWebhook("info", "ignored event", {
      eventType,
      reference,
      outcome: "no_charge_handler",
    });
    return { ok: true, duplicate: false, fulfilled: false };
  }

  if (eventType !== "charge.success") {
    if (recorded.id) {
      await admin
        .from("paystack_webhook_events")
        .update({ status: "processed", processed_at: new Date().toISOString() })
        .eq("id", recorded.id);
    }
    logPaystackWebhook("info", "charge event skipped", { eventType, reference });
    return { ok: true, duplicate: false, fulfilled: false };
  }

  // Source of truth: server-side Paystack verify + amount match (ignores webhook amount)
  const result = await reconcileAndFulfillPayment(admin, reference);

  if (recorded.id) {
    await admin
      .from("paystack_webhook_events")
      .update({
        status: result.ok ? "processed" : "failed",
        processed_at: new Date().toISOString(),
        error_message: result.ok ? null : result.error,
      })
      .eq("id", recorded.id);
  }

  logPaystackWebhook("info", result.ok ? "fulfilled" : "reconcile incomplete", {
    eventType,
    reference,
    outcome: result.ok ? "fulfilled" : result.code ?? "failed",
    fulfilled: result.ok,
  });

  return {
    ok: result.ok || result.code === "pending",
    duplicate: false,
    fulfilled: result.ok,
    reason: result.ok ? undefined : result.code,
  };
}

/**
 * Shared POST handler for /api/payments/webhook and legacy /api/webhooks/paystack.
 * Verifies HMAC-SHA512 signature on raw body before JSON parse.
 */
export async function processPaystackWebhookPost(
  request: Request,
  logTag = "paystack webhook"
): Promise<NextResponse> {
  if (!isPaystackConfigured()) {
    return NextResponse.json({ error: "Paystack not configured" }, { status: 503 });
  }

  const rawBody = await request.text();

  if (paystackProvider.verifyWebhookSignature?.(rawBody, request.headers) !== true) {
    logPaystackWebhook("warn", "rejected before parse", {
      hasSignature: Boolean(request.headers.get("x-paystack-signature")?.trim()),
    });
    return NextResponse.json(
      { error: "Unauthorized", reason: "invalid_signature" },
      { status: 401 }
    );
  }

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
      return NextResponse.json(
        { error: "Unauthorized", reason: result.reason ?? "invalid_signature" },
        { status: result.reason === "not_configured" ? 503 : 401 }
      );
    }
    return NextResponse.json({
      ok: true,
      duplicate: result.duplicate,
      fulfilled: result.fulfilled ?? false,
    });
  } catch (error) {
    console.error(`[${logTag}]`, error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
