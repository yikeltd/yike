import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export function hashIdentifier(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 32);
}

export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash("sha256").update(ip.trim()).digest("hex").slice(0, 32);
}

export function hashUserAgent(ua: string | null): string | null {
  if (!ua) return null;
  return createHash("sha256").update(ua.trim()).digest("hex").slice(0, 32);
}

export type AuthSecurityEventType =
  | "login.success"
  | "login.failed"
  | "login.otp_required"
  | "login.otp_verified"
  | "signup.device_trusted"
  | "pin.success"
  | "pin.failed"
  | "pin.locked"
  | "device.trusted"
  | "device.new"
  | "session.timeout"
  | "session.unlock"
  | "sensitive.confirmed"
  | "sensitive.failed"
  | "bank_change.confirmed"
  | "email_change.confirmed"
  | "password_change.confirmed"
  | "pin.reset"
  | "device.suspicious";

export async function logAuthSecurityEvent(params: {
  userId?: string | null;
  eventType: AuthSecurityEventType;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  await admin.from("auth_security_events").insert({
    user_id: params.userId ?? null,
    event_type: params.eventType,
    metadata: params.metadata ?? {},
    ip_hash: hashIp(params.ip ?? null),
    user_agent_hash: hashUserAgent(params.userAgent ?? null),
  });
}
