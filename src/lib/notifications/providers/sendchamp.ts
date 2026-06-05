import type { OtpChannel, ProviderResult } from "../types";

const BASE_URL = "https://api.sendchamp.com/api/v1";

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

function getConfig(): SendchampConfig | null {
  const apiKey = getSendchampApiKey();
  if (!apiKey) return null;
  return {
    apiKey,
    smsSender: process.env.SENDCHAMP_SMS_SENDER?.trim() || "Yike",
    whatsappSender:
      process.env.SENDCHAMP_WHATSAPP_SENDER?.trim() || process.env.SENDCHAMP_SMS_SENDER?.trim() || "Yike",
  };
}

async function sendchampPost<T>(
  path: string,
  body: Record<string, unknown>
): Promise<ProviderResult<T>> {
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

    if (!res.ok) {
      const message =
        (data.message as string) ||
        (data.error as string) ||
        `Sendchamp request failed (${res.status})`;
      console.error("[sendchamp]", path, res.status, message);
      return { ok: false, error: message };
    }

    return { ok: true, data: data as T };
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

export async function sendOtpWhatsApp(
  phone: string,
  code: string
): Promise<ProviderResult<{ reference?: string }>> {
  const config = getConfig();
  if (!config) return { ok: false, error: "Sendchamp not configured" };

  const mobile = toSendchampPhone(phone);
  const result = await sendchampPost<{
    data?: { reference?: string; verification_reference?: string };
  }>("/verification/send", {
    channel: "WhatsApp",
    sender: config.whatsappSender,
    token_type: "numeric",
    token_length: 6,
    expiration_time: 10,
    customer_mobile_number: mobile,
    meta_data: { product: "yike" },
    token: code,
  });

  if (!result.ok) return result;

  const ref =
    result.data?.data?.verification_reference ?? result.data?.data?.reference;
  return { ok: true, data: { reference: ref } };
}

export async function sendOtpSms(
  phone: string,
  code: string
): Promise<ProviderResult<{ reference?: string }>> {
  const config = getConfig();
  if (!config) return { ok: false, error: "Sendchamp not configured" };

  const mobile = toSendchampPhone(phone);
  const message = `Your Yike code is ${code}. Expires in 10 minutes.`;

  const smsResult = await sendchampPost<{ data?: { reference?: string } }>(
    "/sms/send",
    {
      to: [mobile],
      message,
      sender_name: config.smsSender,
      route: "non_dnd",
    }
  );

  if (smsResult.ok) {
    return { ok: true, data: { reference: smsResult.data?.data?.reference } };
  }

  const verifyFallback = await sendchampPost<{
    data?: { verification_reference?: string };
  }>("/verification/send", {
    channel: "SMS",
    sender: config.smsSender,
    token_type: "numeric",
    token_length: 6,
    expiration_time: 10,
    customer_mobile_number: mobile,
    meta_data: { product: "yike" },
    token: code,
  });

  if (!verifyFallback.ok) return smsResult;

  return {
    ok: true,
    data: {
      reference: verifyFallback.data?.data?.verification_reference,
    },
  };
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
