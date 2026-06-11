import type { SupabaseClient } from "@supabase/supabase-js";
import { paystackProvider } from "@/lib/payments/providers/paystack";
import { verifyPayment } from "@/lib/payments/services/payment-service";

export type PaystackWebhookPayload = {
  event?: string;
  data?: {
    reference?: string;
    id?: number | string;
    status?: string;
  };
};

export async function recordPaystackWebhookEvent(
  admin: SupabaseClient,
  input: {
    eventId: string | null;
    eventType: string | null;
    reference: string | null;
    payload: unknown;
  }
): Promise<{ duplicate: boolean; id: string | null }> {
  if (input.eventId) {
    const { data: existing } = await admin
      .from("paystack_webhook_events")
      .select("id")
      .eq("event_id", input.eventId)
      .maybeSingle();

    if (existing?.id) {
      return { duplicate: true, id: existing.id as string };
    }
  }

  if (input.reference) {
    const { data: processed } = await admin
      .from("paystack_webhook_events")
      .select("id")
      .eq("reference", input.reference)
      .eq("status", "processed")
      .maybeSingle();

    if (processed?.id) {
      return { duplicate: true, id: processed.id as string };
    }
  }

  const { data, error } = await admin
    .from("paystack_webhook_events")
    .insert({
      event_id: input.eventId,
      event_type: input.eventType,
      reference: input.reference,
      payload: input.payload as Record<string, unknown>,
      status: "received",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { duplicate: true, id: null };
    throw error;
  }

  return { duplicate: false, id: data.id as string };
}

export async function handlePaystackWebhook(
  admin: SupabaseClient,
  rawBody: string,
  payload: PaystackWebhookPayload,
  headers: Headers
): Promise<{ ok: boolean; duplicate: boolean; fulfilled?: boolean }> {
  const signatureOk = paystackProvider.verifyWebhookSignature?.(rawBody, headers);
  if (paystackProvider.isConfigured() && signatureOk === false) {
    return { ok: false, duplicate: false };
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
    return { ok: true, duplicate: true };
  }

  if (!reference || !eventType?.startsWith("charge.")) {
    if (recorded.id) {
      await admin
        .from("paystack_webhook_events")
        .update({ status: "processed", processed_at: new Date().toISOString() })
        .eq("id", recorded.id);
    }
    return { ok: true, duplicate: false, fulfilled: false };
  }

  if (eventType !== "charge.success") {
    if (recorded.id) {
      await admin
        .from("paystack_webhook_events")
        .update({ status: "processed", processed_at: new Date().toISOString() })
        .eq("id", recorded.id);
    }
    return { ok: true, duplicate: false, fulfilled: false };
  }

  const result = await verifyPayment(admin, reference);

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

  return {
    ok: result.ok || result.code === "pending",
    duplicate: false,
    fulfilled: result.ok,
  };
}
