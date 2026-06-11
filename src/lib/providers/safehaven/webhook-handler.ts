import type { SupabaseClient } from "@supabase/supabase-js";
import { getSafeHavenConfig, isSafeHavenWebhooksEnabled } from "./config";
import { parseSafeHavenWebhook } from "./client";
import { logSafeHavenEvent } from "./logging";
import { processSafeHavenWebhookTransaction } from "./transactions";

function headersToRecord(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower.includes("authorization") || lower.includes("secret")) {
      out[key] = "[redacted]";
    } else {
      out[key] = value;
    }
  });
  return out;
}

export async function handleSafeHavenWebhook(
  admin: SupabaseClient,
  params: {
    rawBody: string;
    payload: unknown;
    headers: Headers;
    signatureVerified: boolean;
    signatureConfigured: boolean;
  }
): Promise<
  | { ok: true; duplicate: boolean; eventId: string | null }
  | { ok: false; error: string }
> {
  if (!isSafeHavenWebhooksEnabled()) {
    return { ok: false, error: "Webhooks disabled" };
  }

  const parsed = parseSafeHavenWebhook(params.payload, params.headers);
  if (!parsed) {
    return { ok: false, error: "Invalid payload" };
  }

  logSafeHavenEvent("safehaven_webhook_received", {
    eventType: parsed.eventType,
    providerReference: parsed.providerReference,
    signatureConfigured: params.signatureConfigured,
    signatureVerified: params.signatureVerified,
  });

  if (!params.signatureConfigured) {
    logSafeHavenEvent("safehaven_webhook_received", {
      note: "signature_not_configured",
    });
  }

  const eventId =
    parsed.eventId ??
    parsed.providerReference ??
    `safehaven_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const { data: inserted, error } = await admin
    .from("safehaven_webhook_events")
    .insert({
      event_id: eventId,
      provider_reference: parsed.providerReference,
      event_type: parsed.eventType,
      payload: parsed.raw,
      headers: headersToRecord(params.headers),
      status: "received",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      logSafeHavenEvent("safehaven_webhook_duplicate", { eventId });
      return { ok: true, duplicate: true, eventId: parsed.eventId };
    }
    logSafeHavenEvent("safehaven_webhook_failed", { reason: error.message });
    return { ok: false, error: "Could not store webhook" };
  }

  try {
    await processSafeHavenWebhookTransaction(admin, parsed);

    await admin
      .from("safehaven_webhook_events")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
      })
      .eq("id", inserted.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "process_failed";
    logSafeHavenEvent("safehaven_webhook_failed", { reason: message });
    await admin
      .from("safehaven_webhook_events")
      .update({
        status: "failed",
        error_message: message.slice(0, 500),
        processed_at: new Date().toISOString(),
      })
      .eq("id", inserted.id);
  }

  return { ok: true, duplicate: false, eventId: parsed.eventId };
}

export function getSafeHavenWebhookHealth() {
  const config = getSafeHavenConfig();
  return {
    ok: true,
    endpoint: "safehaven-webhook",
    url: "https://yike.ng/api/webhooks/safehaven",
    webhooksEnabled: config.webhooksEnabled,
    signatureConfigured: Boolean(config.webhookSecret),
  };
}
