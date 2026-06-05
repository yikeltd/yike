import type { SupabaseClient } from "@supabase/supabase-js";
import type { OtpChannel } from "../types";
import { logOtpEvent } from "@/lib/otp/logs";

export type SendchampWebhookPayload = {
  service: string;
  status: string;
  phone: string;
  reference?: string;
  message?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

/** International (+234…) or local → Yike 11-digit local. */
export function sendchampPhoneToLocal(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length === 13) {
    return `0${digits.slice(3)}`;
  }
  if (digits.length === 10 && !digits.startsWith("0")) {
    return `0${digits}`;
  }
  return digits.slice(0, 11);
}

export function parseSendchampWebhook(body: unknown): SendchampWebhookPayload | null {
  const root = asRecord(body);
  if (!root) return null;

  const nested = asRecord(root.data) ?? asRecord(root.payload) ?? root;

  const service = pickString(nested, "service", "channel", "type").toLowerCase();
  const status = pickString(nested, "status", "delivery_status", "state").toLowerCase();
  const phone = pickString(
    nested,
    "phone_number",
    "phone",
    "customer_mobile_number",
    "mobile",
    "to"
  );

  if (!service && !status && !phone) return null;

  const reference = pickString(
    nested,
    "reference",
    "sms_uid",
    "verification_reference",
    "uid",
    "id"
  );

  const message = pickString(nested, "message", "body", "text");

  return {
    service: service || "unknown",
    status: status || "unknown",
    phone,
    reference: reference || undefined,
    message: message || undefined,
  };
}

export function mapWebhookChannel(service: string): OtpChannel {
  const normalized = service.toLowerCase();
  if (normalized.includes("whatsapp")) return "whatsapp";
  return "sms";
}

export function mapWebhookLogStatus(status: string): string {
  const normalized = status.toLowerCase();
  if (["delivered", "delivery", "read", "success", "successful", "completed"].includes(normalized)) {
    return "delivered";
  }
  if (["failed", "undelivered", "rejected", "expired", "error"].includes(normalized)) {
    return "failed";
  }
  if (["sent", "pending", "queued", "submitted", "processing"].includes(normalized)) {
    return "sent";
  }
  return `webhook_${normalized || "unknown"}`;
}

export async function handleSendchampWebhook(
  admin: SupabaseClient,
  payload: SendchampWebhookPayload
): Promise<void> {
  const phone = payload.phone ? sendchampPhoneToLocal(payload.phone) : "";
  const channel = mapWebhookChannel(payload.service);
  const status = mapWebhookLogStatus(payload.status);

  if (phone) {
    await logOtpEvent(admin, {
      phone,
      channel,
      status,
    });
  }

  if (payload.reference && phone) {
    const { data: row } = await admin
      .from("phone_otp_requests")
      .select("id, provider_reference")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (row && !row.provider_reference) {
      await admin
        .from("phone_otp_requests")
        .update({ provider_reference: payload.reference })
        .eq("id", row.id);
    }
  }
}
