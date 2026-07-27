import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Idempotent webhook event recorder — no payment-service dependency
 * so unit tests can exercise dedupe without Next.js server-only imports.
 */
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
