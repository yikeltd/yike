import type { OtpChannel, ProviderResult } from "../types";
import { buildSmsOtpMessage } from "@/lib/phone-verification/copy";
import {
  logOtpAudit,
  pickResponseHeaders,
  sanitizeSendchampPayload,
} from "@/lib/otp/delivery-audit";
import {
  auditSendchampEnv,
  looksLikeSupabaseKey,
  resolveSmsSender,
} from "./sendchamp-keys";
import {
  isSendchampSuccess,
  pickSendchampReference,
  sendchampErrorMessage,
  type SendchampEnvelope,
} from "./sendchamp-response";
import { otpExpiryMinutes } from "./sendchamp-verification";

const DEFAULT_BASE_URL = "https://api.sendchamp.com/api/v1";
const FETCH_TIMEOUT_MS = 25_000;

function getBaseUrl(): string {
  return process.env.SENDCHAMP_LIVE_BASE_URL?.trim() || DEFAULT_BASE_URL;
}

type SendchampConfig = {
  apiKeys: string[];
  smsSender: string;
  whatsappSender: string;
};

/** Public access key first; optional SENDCHAMP_API_KEY if dashboard provides it. */
function getSendchampApiKeys(): string[] {
  const keys = [
    process.env.SENDCHAMP_API_KEY?.trim(),
    process.env.SENDCHAMP_PUBLIC_KEY?.trim(),
  ].filter((key): key is string => {
    if (!key) return false;
    return !looksLikeSupabaseKey(key);
  });
  return [...new Set(keys)];
}

/** WhatsApp sender must be an international phone number (234…). */
export function resolveWhatsAppSender(raw?: string): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";

  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length === 13) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return `234${digits.slice(1)}`;
  if (digits.length === 10) return `234${digits}`;
  if (digits.length >= 13) return digits;
  return "";
}

function getConfig(): SendchampConfig | null {
  const apiKeys = getSendchampApiKeys();
  if (apiKeys.length === 0) return null;

  const smsSender = resolveSmsSender(process.env.SENDCHAMP_SMS_SENDER);
  const whatsappSender =
    resolveWhatsAppSender(process.env.SENDCHAMP_WHATSAPP_SENDER?.trim()) || "";

  return { apiKeys, smsSender, whatsappSender };
}

export function getSendchampConfigSummary() {
  const config = getConfig();
  const baseUrl = getBaseUrl();
  if (!config) {
    return {
      configured: false as const,
      baseUrlConfigured: Boolean(process.env.SENDCHAMP_LIVE_BASE_URL?.trim()),
      publicKeyConfigured: Boolean(process.env.SENDCHAMP_PUBLIC_KEY?.trim()),
      supabaseKeyRejected: [
        process.env.SENDCHAMP_PUBLIC_KEY,
        process.env.SENDCHAMP_API_KEY,
      ].some((key) => key?.trim() && looksLikeSupabaseKey(key.trim())),
      envWarnings: auditSendchampEnv(),
    };
  }
  const envWarnings = auditSendchampEnv();
  return {
    configured: true as const,
    baseUrlConfigured: Boolean(baseUrl),
    publicKeyConfigured: Boolean(process.env.SENDCHAMP_PUBLIC_KEY?.trim()),
    smsSender: config.smsSender,
    smsSenderRaw: process.env.SENDCHAMP_SMS_SENDER?.trim() || null,
    whatsappSender: config.whatsappSender || null,
    smsSenderConfigured: Boolean(config.smsSender),
    whatsappSenderConfigured: Boolean(config.whatsappSender),
    envWarnings,
    supabaseKeyRejected: [
      process.env.SENDCHAMP_PUBLIC_KEY,
      process.env.SENDCHAMP_API_KEY,
    ].some((key) => key?.trim() && looksLikeSupabaseKey(key.trim())),
  };
}

async function sendchampPost<T extends Record<string, unknown>>(
  path: string,
  body: Record<string, unknown>,
  options: { requestId?: string; phone?: string; billable?: boolean } = {}
): Promise<ProviderResult<SendchampEnvelope<T>>> {
  const config = getConfig();
  if (!config) {
    return { ok: false, error: "Sendchamp not configured" };
  }

  const baseUrl = getBaseUrl();
  const billable =
    options.billable ?? (path.includes("/sms/") || path.includes("/verification/"));
  // Billable: one key, one attempt — never timeout-retry (double charge risk).
  const keysToTry = billable ? config.apiKeys.slice(0, 1) : config.apiKeys;
  let lastError = "Sendchamp request failed";

  for (let keyIndex = 0; keyIndex < keysToTry.length; keyIndex++) {
    const apiKey = keysToTry[keyIndex]!;
    const started = Date.now();
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      const durationMs = Date.now() - started;

      logOtpAudit({
        event: "sendchamp_http_response",
        requestId: options.requestId ?? "unknown",
        phone: options.phone,
        path,
        httpStatus: res.status,
        responseHeaders: pickResponseHeaders(res),
        responseBody: data,
        requestPayload: sanitizeSendchampPayload(body),
        deliveryReference: pickSendchampReference(data),
        deliveryStatus: String(
          (data.data as Record<string, unknown> | undefined)?.status ??
            data.status ??
            ""
        ),
        retryCount: keyIndex,
        durationMs,
      });

      if (isSendchampSuccess(data, res.ok)) {
        return { ok: true, data: data as SendchampEnvelope<T> };
      }

      lastError = sendchampErrorMessage(data, res.status);
      console.error(
        "[sendchamp]",
        path,
        res.status,
        lastError,
        JSON.stringify(data).slice(0, 500)
      );
      if (billable) break;
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      lastError =
        err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")
          ? "Sendchamp request timed out"
          : `Sendchamp network error: ${detail.slice(0, 120)}`;
      logOtpAudit({
        event: "sendchamp_http_error",
        requestId: options.requestId ?? "unknown",
        phone: options.phone,
        path,
        requestPayload: sanitizeSendchampPayload(body),
        retryCount: keyIndex,
        durationMs: Date.now() - started,
        error: lastError,
      });
      console.error("[sendchamp]", path, lastError);
      if (billable) break;
    }
  }

  return { ok: false, error: lastError };
}

/** Nigerian 11-digit local → 234… international (no +). */
export function toSendchampPhone(localPhone: string): string {
  const digits = localPhone.replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length === 13) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}

export function isSendchampConfigured(): boolean {
  return getSendchampApiKeys().length > 0;
}

/** Sendchamp verification API — WhatsApp / diagnostics only. Never used for SMS delivery. */
type VerificationChannel = "WHATSAPP" | "whatsapp";

async function sendVerificationOtp(
  channel: VerificationChannel,
  sender: string,
  mobile: string,
  code: string
): Promise<ProviderResult<{ reference?: string }>> {
  const result = await sendchampPost<Record<string, unknown>>("/verification/create", {
    channel,
    sender,
    token_type: "NUMERIC",
    token_length: 6,
    expiration_time: otpExpiryMinutes(),
    customer_mobile_number: mobile,
    meta_data: { product: "yike", purpose: "phone_verification" },
    token: code,
  });

  if (!result.ok) return result;

  const reference = pickSendchampReference(result.data ?? {});
  return { ok: true, data: { reference } };
}

/** Single route for branded SMS — multi-route spray caused multiple charge attempts. */
function smsOtpRoute(): string {
  return process.env.SENDCHAMP_SMS_ROUTE?.trim().split(",")[0]?.trim() || "dnd";
}

async function sendSmsMessage(
  mobile: string,
  message: string,
  sender_name: string,
  route: string,
  options: { requestId?: string; phone?: string } = {}
): Promise<ProviderResult<{ reference?: string }>> {
  const result = await sendchampPost<Record<string, unknown>>(
    "/sms/send",
    {
      to: [mobile],
      message,
      sender_name,
      route,
    },
    { ...options, billable: true }
  );

  if (!result.ok) return result;

  const reference = pickSendchampReference(result.data ?? {});
  return { ok: true, data: { reference } };
}

export async function sendWhatsAppText(
  phone: string,
  message: string,
  sender?: string
): Promise<ProviderResult<{ reference?: string }>> {
  const config = getConfig();
  if (!config) return { ok: false, error: "Sendchamp not configured" };

  const waSender = sender || config.whatsappSender;
  if (!waSender) {
    return { ok: false, error: "WhatsApp sender not configured" };
  }

  const result = await sendchampPost<Record<string, unknown>>(
    "/whatsapp/message/send",
    {
      message,
      type: "text",
      sender: waSender,
      recipient: toSendchampPhone(phone),
    }
  );

  if (!result.ok) return result;

  const reference = pickSendchampReference(result.data ?? {});
  return { ok: true, data: { reference } };
}

/**
 * Branded `/sms/send` — ops/diagnostics only.
 * Production seller/auth OTP must NOT call this in the same request as Verification create.
 */
export async function sendBrandedSmsOtp(
  phone: string,
  code: string,
  options: { requestId?: string } = {}
): Promise<ProviderResult<{ reference?: string }>> {
  const config = getConfig();
  if (!config) return { ok: false, error: "Sendchamp not configured" };

  const mobile = toSendchampPhone(phone);
  const message = buildSmsOtpMessage(code);
  const route = smsOtpRoute();

  logOtpAudit({
    event: "sms_send_start",
    requestId: options.requestId ?? "unknown",
    phone: mobile,
    path: "/sms/send",
    requestPayload: sanitizeSendchampPayload({
      to: [mobile],
      message,
      sender_name: config.smsSender,
      route,
    }),
  });

  const direct = await sendSmsMessage(mobile, message, config.smsSender, route, {
    requestId: options.requestId,
    phone: mobile,
  });

  if (direct.ok) {
    logOtpAudit({
      event: "sms_send_ok",
      requestId: options.requestId ?? "unknown",
      phone: mobile,
      deliveryReference: direct.data?.reference,
      deliveryStatus: "ok",
    });
    return direct;
  }

  logOtpAudit({
    event: "sms_send_failed",
    requestId: options.requestId ?? "unknown",
    phone: mobile,
    error: direct.error,
  });
  return { ok: false, error: direct.error || "SMS delivery failed" };
}

/**
 * SMS OTP delivery — branded `/sms/send` (fallback helper).
 * Primary production path is Verification API via phone-verification / otp service.
 */
export async function sendOtpSms(
  phone: string,
  code: string
): Promise<ProviderResult<{ reference?: string }>> {
  return sendBrandedSmsOtp(phone, code);
}

export async function sendOtpWhatsApp(
  phone: string,
  code: string
): Promise<ProviderResult<{ reference?: string }>> {
  const config = getConfig();
  if (!config) return { ok: false, error: "Sendchamp not configured" };

  const mobile = toSendchampPhone(phone);
  const message = buildSmsOtpMessage(code);

  if (!config.whatsappSender) {
    return { ok: false, error: "WhatsApp sender not configured" };
  }

  if (!/^234\d{10}$/.test(config.whatsappSender)) {
    return {
      ok: false,
      error: `WhatsApp sender must be a 234… phone number (got ${config.whatsappSender.slice(0, 8)}…)`,
    };
  }

  // Direct WhatsApp text is more reliable than /verification/create (often times out).
  const text = await sendWhatsAppText(phone, message, config.whatsappSender);
  if (text.ok) return text;

  return sendVerificationOtp("WHATSAPP", config.whatsappSender, mobile, code);
}

/** Prefer SMS (production). WhatsApp only when explicitly requested. */
export async function deliverOtp(
  phone: string,
  code: string,
  preferred?: OtpChannel
): Promise<ProviderResult<{ channel: OtpChannel; reference?: string }>> {
  if (preferred === "whatsapp") {
    const whatsapp = await sendOtpWhatsApp(phone, code);
    if (!whatsapp.ok) return whatsapp;
    return {
      ok: true,
      data: { channel: "whatsapp", reference: whatsapp.data?.reference },
    };
  }

  const sms = await sendOtpSms(phone, code);
  if (!sms.ok) {
    return {
      ok: false,
      error: sms.error || "delivery_failed",
    };
  }
  return { ok: true, data: { channel: "sms", reference: sms.data?.reference } };
}

export type SendchampDiagnosticStep = {
  step: string;
  ok: boolean;
  error?: string;
};

/** Ops-only: probe each delivery path with a fake number (no user OTP). */
export async function runSendchampDiagnostics(
  testMobile = "2348010000000"
): Promise<SendchampDiagnosticStep[]> {
  const config = getConfig();
  if (!config) {
    return [{ step: "config", ok: false, error: "Sendchamp not configured" }];
  }

  const code = "123456";
  const steps: SendchampDiagnosticStep[] = [];
  const message = `Yike diagnostic ${code}`;

  const auth = await sendchampPost("/whatsapp/validate", {
    phone_number: testMobile,
  });
  steps.push({
    step: "auth_whatsapp_validate",
    ok: auth.ok,
    error: auth.ok ? undefined : auth.error,
  });

  const route = smsOtpRoute();
  const sms = await sendSmsMessage(testMobile, message, config.smsSender, route);
  steps.push({
    step: `sms_send_${route}`,
    ok: sms.ok,
    error: sms.ok ? undefined : sms.error,
  });

  if (config.whatsappSender) {
    const waVerify = await sendVerificationOtp(
      "WHATSAPP",
      config.whatsappSender,
      testMobile,
      code
    );
    steps.push({
      step: "verification_whatsapp",
      ok: waVerify.ok,
      error: waVerify.ok ? undefined : waVerify.error,
    });

    const waText = await sendWhatsAppText(testMobile, message, config.whatsappSender);
    steps.push({
      step: "whatsapp_text",
      ok: waText.ok,
      error: waText.ok ? undefined : waText.error,
    });
  } else {
    steps.push({
      step: "whatsapp_sender",
      ok: false,
      error: "SENDCHAMP_WHATSAPP_SENDER not set",
    });
  }

  return steps;
}
