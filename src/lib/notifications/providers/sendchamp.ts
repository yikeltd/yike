import type { OtpChannel, ProviderResult } from "../types";
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

const DEFAULT_BASE_URL = "https://api.sendchamp.com/api/v1";
const FETCH_TIMEOUT_MS = 25_000;
const FETCH_RETRIES = 2;

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
    process.env.SENDCHAMP_PUBLIC_KEY?.trim(),
    process.env.SENDCHAMP_API_KEY?.trim(),
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
  body: Record<string, unknown>
): Promise<ProviderResult<SendchampEnvelope<T>>> {
  const config = getConfig();
  if (!config) {
    return { ok: false, error: "Sendchamp not configured" };
  }

  const baseUrl = getBaseUrl();
  let lastError = "Sendchamp request failed";

  for (const apiKey of config.apiKeys) {
    for (let attempt = 0; attempt < FETCH_RETRIES; attempt++) {
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
        break;
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        lastError =
          err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")
            ? "Sendchamp request timed out"
            : `Sendchamp network error: ${detail.slice(0, 120)}`;
        console.error("[sendchamp]", path, lastError, `attempt ${attempt + 1}`);
        if (attempt + 1 < FETCH_RETRIES) continue;
      }
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

/** Sendchamp verification API accepts SMS/WHATSAPP or lowercase variants. */
type VerificationChannel = "SMS" | "WHATSAPP" | "sms" | "whatsapp";

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
    expiration_time: 10,
    customer_mobile_number: mobile,
    meta_data: { product: "yike", purpose: "phone_verification" },
    token: code,
  });

  if (!result.ok) return result;

  const reference = pickSendchampReference(result.data ?? {});
  return { ok: true, data: { reference } };
}

async function sendSmsMessage(
  mobile: string,
  message: string,
  sender_name: string,
  route: "dnd" | "non_dnd"
): Promise<ProviderResult<{ reference?: string }>> {
  const result = await sendchampPost<Record<string, unknown>>("/sms/send", {
    to: [mobile],
    message,
    sender_name,
    route,
  });

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

export async function sendOtpSms(
  phone: string,
  code: string
): Promise<ProviderResult<{ reference?: string }>> {
  const config = getConfig();
  if (!config) return { ok: false, error: "Sendchamp not configured" };

  const mobile = toSendchampPhone(phone);
  const message = `Your Yike verification code is ${code}. Valid for 10 minutes. Do not share this code.`;

  // Direct SMS with explicit code — most reliable for signup OTP.
  for (const route of ["non_dnd", "dnd"] as const) {
    const direct = await sendSmsMessage(mobile, message, config.smsSender, route);
    if (direct.ok) return direct;
  }

  for (const channel of ["SMS", "sms"] as const) {
    const verification = await sendVerificationOtp(channel, config.smsSender, mobile, code);
    if (verification.ok) return verification;
  }

  return { ok: false, error: "SMS delivery failed" };
}

export async function sendOtpWhatsApp(
  phone: string,
  code: string
): Promise<ProviderResult<{ reference?: string }>> {
  const config = getConfig();
  if (!config) return { ok: false, error: "Sendchamp not configured" };

  const mobile = toSendchampPhone(phone);
  const message = `Your Yike verification code is ${code}. Valid for 10 minutes. Do not share this code.`;

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

export async function deliverOtp(
  phone: string,
  code: string,
  preferred?: OtpChannel
): Promise<ProviderResult<{ channel: OtpChannel; reference?: string }>> {
  if (preferred === "sms") {
    const sms = await sendOtpSms(phone, code);
    if (!sms.ok) return sms;
    return { ok: true, data: { channel: "sms", reference: sms.data?.reference } };
  }

  if (preferred === "whatsapp") {
    const whatsapp = await sendOtpWhatsApp(phone, code);
    if (!whatsapp.ok) return whatsapp;
    return {
      ok: true,
      data: { channel: "whatsapp", reference: whatsapp.data?.reference },
    };
  }

  const whatsapp = await sendOtpWhatsApp(phone, code);
  if (whatsapp.ok) {
    return {
      ok: true,
      data: { channel: "whatsapp", reference: whatsapp.data?.reference },
    };
  }

  const sms = await sendOtpSms(phone, code);
  if (!sms.ok) {
    return {
      ok: false,
      error: whatsapp.error || sms.error || "delivery_failed",
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

  for (const route of ["non_dnd", "dnd"] as const) {
    const sms = await sendSmsMessage(testMobile, message, config.smsSender, route);
    steps.push({
      step: `sms_send_${route}`,
      ok: sms.ok,
      error: sms.ok ? undefined : sms.error,
    });
    if (sms.ok) break;
  }

  const smsVerify = await sendVerificationOtp("SMS", config.smsSender, testMobile, code);
  steps.push({
    step: "verification_sms",
    ok: smsVerify.ok,
    error: smsVerify.ok ? undefined : smsVerify.error,
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
