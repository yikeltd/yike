import type { OtpChannel, ProviderResult } from "../types";
import {
  isSendchampSuccess,
  pickSendchampReference,
  sendchampErrorMessage,
  type SendchampEnvelope,
} from "./sendchamp-response";

const BASE_URL = "https://api.sendchamp.com/api/v1";
const DEFAULT_SMS_SENDER = "Sendchamp";
/** Sendchamp shared WhatsApp sender when no number is registered — see API docs. */
const DEFAULT_WHATSAPP_SENDER = "2348120678278";

type SendchampConfig = {
  apiKey: string;
  smsSender: string;
  whatsappSender: string;
};

function getSendchampApiKey(): string {
  return (
    process.env.SENDCHAMP_API_KEY?.trim() ||
    process.env.SENDCHAMP_PUBLIC_KEY?.trim() ||
    ""
  );
}

/** WhatsApp sender must be an international phone number (234…). */
export function resolveWhatsAppSender(raw?: string): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return DEFAULT_WHATSAPP_SENDER;

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 10) {
    if (digits.startsWith("234") && digits.length === 13) return digits;
    if (digits.length === 11 && digits.startsWith("0")) return `234${digits.slice(1)}`;
    if (digits.length === 10) return `234${digits}`;
    return digits;
  }

  return DEFAULT_WHATSAPP_SENDER;
}

function getConfig(): SendchampConfig | null {
  const apiKey = getSendchampApiKey();
  if (!apiKey) return null;
  return {
    apiKey,
    smsSender: process.env.SENDCHAMP_SMS_SENDER?.trim() || DEFAULT_SMS_SENDER,
    whatsappSender: resolveWhatsAppSender(
      process.env.SENDCHAMP_WHATSAPP_SENDER?.trim() ||
        process.env.SENDCHAMP_SMS_SENDER?.trim()
    ),
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

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!isSendchampSuccess(data, res.ok)) {
      const message = sendchampErrorMessage(data, res.status);
      console.error("[sendchamp]", path, res.status, message, data);
      return { ok: false, error: message };
    }

    return { ok: true, data: data as SendchampEnvelope<T> };
  } catch {
    return { ok: false, error: "Sendchamp network error" };
  }
}

/** Nigerian 11-digit local → 234… international (no +). */
export function toSendchampPhone(localPhone: string): string {
  const digits = localPhone.replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length === 13) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}

export function isSendchampConfigured(): boolean {
  return Boolean(getSendchampApiKey());
}

/** Lightweight auth check — does not send OTP. */
export async function probeSendchampConnection(): Promise<
  ProviderResult<{ message: string }>
> {
  const result = await sendchampPost<Record<string, unknown>>(
    "/whatsapp/validate",
    { phone_number: DEFAULT_WHATSAPP_SENDER }
  );

  if (!result.ok) return result;

  const message =
    (typeof result.data?.message === "string" && result.data.message) ||
    "Sendchamp API reachable";
  return { ok: true, data: { message } };
}

type VerificationCreateBody = {
  channel: "whatsapp" | "sms";
  sender: string;
  token_type: "numeric";
  token_length: number;
  expiration_time: number;
  customer_mobile_number: string;
  meta_data: Record<string, unknown>;
  token: string;
};

async function sendVerificationOtp(
  body: VerificationCreateBody
): Promise<ProviderResult<{ reference?: string }>> {
  const senders =
    body.channel === "whatsapp"
      ? [...new Set([body.sender, DEFAULT_WHATSAPP_SENDER])]
      : [...new Set([body.sender, DEFAULT_SMS_SENDER])];

  let lastError = "Sendchamp verification failed";

  for (const sender of senders) {
    const result = await sendchampPost<Record<string, unknown>>(
      "/verification/create",
      { ...body, sender }
    );

    if (result.ok) {
      const reference = pickSendchampReference(result.data ?? {});
      return { ok: true, data: { reference } };
    }

    lastError = result.error;
  }

  return { ok: false, error: lastError };
}

export async function sendWhatsAppText(
  phone: string,
  message: string
): Promise<ProviderResult<{ reference?: string }>> {
  const config = getConfig();
  if (!config) return { ok: false, error: "Sendchamp not configured" };

  const recipient = toSendchampPhone(phone);
  let lastError = "Sendchamp WhatsApp failed";

  for (const sender of [...new Set([config.whatsappSender, DEFAULT_WHATSAPP_SENDER])]) {
    const result = await sendchampPost<Record<string, unknown>>(
      "/whatsapp/message/send",
      { message, type: "text", sender, recipient }
    );

    if (result.ok) {
      const reference = pickSendchampReference(result.data ?? {});
      return { ok: true, data: { reference } };
    }

    lastError = result.error;
  }

  return { ok: false, error: lastError };
}

export async function sendOtpWhatsApp(
  phone: string,
  code: string
): Promise<ProviderResult<{ reference?: string }>> {
  const config = getConfig();
  if (!config) return { ok: false, error: "Sendchamp not configured" };

  const mobile = toSendchampPhone(phone);
  const verification = await sendVerificationOtp({
    channel: "whatsapp",
    sender: config.whatsappSender,
    token_type: "numeric",
    token_length: 6,
    expiration_time: 10,
    customer_mobile_number: mobile,
    meta_data: { product: "yike" },
    token: code,
  });

  if (verification.ok) return verification;

  const text = await sendWhatsAppText(
    phone,
    `Your Yike verification code is ${code}. Expires in 10 minutes.`
  );
  return text;
}

export async function sendOtpSms(
  phone: string,
  code: string
): Promise<ProviderResult<{ reference?: string }>> {
  const config = getConfig();
  if (!config) return { ok: false, error: "Sendchamp not configured" };

  const mobile = toSendchampPhone(phone);
  const message = `Your Yike code is ${code}. Expires in 10 minutes.`;

  let smsResult: ProviderResult<SendchampEnvelope<Record<string, unknown>>> = {
    ok: false,
    error: "Sendchamp SMS failed",
  };

  for (const sender_name of [...new Set([config.smsSender, DEFAULT_SMS_SENDER])]) {
    for (const route of ["non_dnd", "dnd"] as const) {
      const attempt = await sendchampPost<Record<string, unknown>>("/sms/send", {
        to: [mobile],
        message,
        sender_name,
        route,
      });

      if (attempt.ok) {
        const reference = pickSendchampReference(attempt.data ?? {});
        return { ok: true, data: { reference } };
      }

      smsResult = attempt;
    }
  }

  const verifyFallback = await sendVerificationOtp({
    channel: "sms",
    sender: config.smsSender,
    token_type: "numeric",
    token_length: 6,
    expiration_time: 10,
    customer_mobile_number: mobile,
    meta_data: { product: "yike" },
    token: code,
  });

  if (!verifyFallback.ok) return smsResult;

  return verifyFallback;
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

  const whatsapp = await sendOtpWhatsApp(phone, code);
  if (whatsapp.ok) {
    return {
      ok: true,
      data: { channel: "whatsapp", reference: whatsapp.data?.reference },
    };
  }

  const sms = await sendOtpSms(phone, code);
  if (!sms.ok) return { ok: false, error: OTP_DELIVERY_FAILED };
  return { ok: true, data: { channel: "sms", reference: sms.data?.reference } };
}

const OTP_DELIVERY_FAILED = "delivery_failed";
