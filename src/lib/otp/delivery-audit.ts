/**
 * Temporary OTP delivery audit logger (P0 charge/no-delivery investigation).
 * Enable with OTP_DELIVERY_AUDIT=true (default on until investigation closes).
 * Redact by setting OTP_DELIVERY_AUDIT_REDACT=true (hashes phone, drops OTP hash).
 */
import { createHash, randomUUID } from "crypto";

function auditEnabled(): boolean {
  const raw = process.env.OTP_DELIVERY_AUDIT?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return true; // temporary default ON for production diagnosis
}

function redact(): boolean {
  const raw = process.env.OTP_DELIVERY_AUDIT_REDACT?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

export function newOtpRequestId(): string {
  return randomUUID();
}

export function auditPhone(phone: string): string {
  if (!redact()) return phone;
  return `fp:${createHash("sha256").update(phone).digest("hex").slice(0, 12)}`;
}

export function auditOtpHash(hash: string): string {
  if (!redact()) return hash;
  return `${hash.slice(0, 8)}…`;
}

export type OtpAuditEvent = {
  event: string;
  requestId: string;
  phone?: string;
  otpHash?: string;
  reference?: string;
  path?: string;
  httpStatus?: number;
  responseBody?: unknown;
  responseHeaders?: Record<string, string>;
  requestPayload?: Record<string, unknown>;
  deliveryReference?: string;
  deliveryStatus?: string;
  retryCount?: number;
  durationMs?: number;
  error?: string;
  [key: string]: unknown;
};

export function logOtpAudit(payload: OtpAuditEvent): void {
  if (!auditEnabled()) return;

  const safe: OtpAuditEvent = {
    ...payload,
    phone: payload.phone ? auditPhone(payload.phone) : undefined,
    otpHash: payload.otpHash ? auditOtpHash(payload.otpHash) : undefined,
  };

  // Single-line JSON for Coolify/log drains.
  console.info("[otp-audit]", JSON.stringify(safe));
}

/** Sanitize Sendchamp body for logs (never log full API keys). */
export function sanitizeSendchampPayload(
  body: Record<string, unknown>
): Record<string, unknown> {
  const clone: Record<string, unknown> = { ...body };
  if (clone.token && typeof clone.token === "string") {
    clone.token = "[redacted-token]";
  }
  if (clone.message && typeof clone.message === "string") {
    // Keep shape; scrub digits that look like OTP codes.
    clone.message = String(clone.message).replace(/\b\d{4,8}\b/g, "[otp]");
  }
  if (clone.meta_data && typeof clone.meta_data === "object") {
    clone.meta_data = { ...(clone.meta_data as object) };
  }
  return clone;
}

export function pickResponseHeaders(res: Response): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of [
    "content-type",
    "x-request-id",
    "x-ratelimit-remaining",
    "retry-after",
  ]) {
    const v = res.headers.get(name);
    if (v) out[name] = v;
  }
  return out;
}
