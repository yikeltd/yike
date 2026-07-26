import { SENDCHAMP_OTP_META_MESSAGE } from "@/lib/phone-verification/copy";
import {
  isSendchampSuccess,
  pickSendchampReference,
  sendchampErrorMessage,
  type SendchampEnvelope,
} from "./sendchamp-response";
import { looksLikeSupabaseKey, resolveSmsSender } from "./sendchamp-keys";

const DEFAULT_BASE_URL = "https://api.sendchamp.com/api/v1";
const FETCH_TIMEOUT_MS = 25_000;

export type SendchampVerificationPurpose =
  | "account_verification"
  | "whatsapp_number_verification"
  | "phone_verification"
  | string;

export type SendchampVerificationChannel = "sms" | "whatsapp" | "email";

function getBaseUrl(): string {
  return process.env.SENDCHAMP_LIVE_BASE_URL?.trim() || DEFAULT_BASE_URL;
}

function getApiKeys(): string[] {
  const keys = [
    process.env.SENDCHAMP_API_KEY?.trim(),
    process.env.SENDCHAMP_PUBLIC_KEY?.trim(),
  ].filter(
    (key): key is string =>
      typeof key === "string" && key.length > 0 && !looksLikeSupabaseKey(key)
  );
  return [...new Set(keys)];
}

export function otpLength(): number {
  const n = Number(process.env.SENDCHAMP_OTP_LENGTH ?? process.env.WHATSAPP_OTP_LENGTH ?? 6);
  return Number.isFinite(n) && n >= 4 && n <= 8 ? n : 6;
}

export function otpExpiryMinutes(): number {
  const n = Number(
    process.env.SENDCHAMP_OTP_EXPIRY_MINUTES ?? process.env.WHATSAPP_OTP_EXPIRY_MINUTES ?? 30
  );
  return Number.isFinite(n) && n >= 5 && n <= 60 ? n : 30;
}

function resolveChannel(
  explicit?: SendchampVerificationChannel
): SendchampVerificationChannel {
  if (explicit) return explicit;
  const raw =
    process.env.SENDCHAMP_OTP_CHANNEL?.trim().toLowerCase() ||
    process.env.WHATSAPP_OTP_CHANNEL?.trim().toLowerCase() ||
    "sms";
  if (raw === "whatsapp" || raw === "wa") return "whatsapp";
  if (raw === "email") return "email";
  return "sms";
}

async function post<T extends Record<string, unknown>>(
  path: string,
  body: Record<string, unknown>
): Promise<{ ok: true; data: SendchampEnvelope<T> } | { ok: false; error: string; status?: number }> {
  const apiKeys = getApiKeys();
  if (apiKeys.length === 0) {
    return { ok: false, error: "Sendchamp not configured", status: 503 };
  }

  const baseUrl = getBaseUrl();
  let lastError = "Sendchamp request failed";
  let lastStatus = 502;

  for (const apiKey of apiKeys) {
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
      lastStatus = res.status;

      if (isSendchampSuccess(data, res.ok)) {
        return { ok: true, data: data as SendchampEnvelope<T> };
      }

      lastError = sendchampErrorMessage(data, res.status);
      if (res.status === 401) {
        return { ok: false, error: lastError, status: 401 };
      }
    } catch (err) {
      lastError =
        err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")
          ? "Sendchamp request timed out"
          : "Sendchamp network error";
    }
  }

  return { ok: false, error: lastError, status: lastStatus };
}

export function isSendchampVerificationConfigured(): boolean {
  return getApiKeys().length > 0;
}

/**
 * Create a Sendchamp Verification OTP session and (unless `inAppToken`) deliver it.
 * Production SMS matches BamSignal: `/verification/create` + approved sender `YIKE`
 * + optional branded `meta_data.message` (`{{code}}`). Confirm via `/verification/confirm`.
 */
export async function createSendchampVerificationOtp(params: {
  phoneIntl: string;
  purpose: SendchampVerificationPurpose;
  email?: string;
  channel?: SendchampVerificationChannel;
  /** Server-generated OTP when registering without Sendchamp delivery. */
  token?: string;
  /** When true, register session only — Sendchamp does not SMS/WhatsApp the code. */
  inAppToken?: boolean;
}): Promise<
  | { ok: true; reference: string; expiresMinutes: number }
  | { ok: false; error: string; status: number; code?: "provider_auth_failed" }
> {
  const channel = resolveChannel(params.channel);
  const expiresMinutes = otpExpiryMinutes();
  const inAppToken = params.inAppToken ?? false;

  const tryCreate = async (includeCustomMessage: boolean) => {
    const meta_data: Record<string, unknown> = {
      app: "Yike",
      brand: "Yike",
      purpose: params.purpose,
      description: "Yike phone verification",
    };
    // BamSignal-compatible custom OTP copy (Sendchamp substitutes {{code}}).
    if (channel === "sms" && !inAppToken && includeCustomMessage) {
      meta_data.message = SENDCHAMP_OTP_META_MESSAGE;
    }

    const body: Record<string, unknown> = {
      channel,
      token_type: "numeric",
      token_length: otpLength(),
      expiration_time: expiresMinutes,
      customer_mobile_number: params.phoneIntl,
      customer_email_address: params.email?.trim() || "",
      meta_data,
      in_app_token: inAppToken,
    };

    if (params.token) {
      body.token = params.token;
    }

    // SMS requires approved sender ID (production: YIKE).
    if (channel === "sms") {
      body.sender = resolveSmsSender(process.env.SENDCHAMP_SMS_SENDER ?? "YIKE");
    }

    return post("/verification/create", body);
  };

  let result = await tryCreate(true);

  // If custom meta message is rejected, retry without it (still delivers via Verification).
  if (
    !result.ok &&
    channel === "sms" &&
    !inAppToken &&
    /message|meta_data|template|invalid/i.test(result.error)
  ) {
    console.warn(
      "[sendchamp] verification custom message rejected — retrying without meta_data.message"
    );
    result = await tryCreate(false);
  }

  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      status: result.status === 401 ? 503 : result.status ?? 502,
      code: result.status === 401 ? "provider_auth_failed" : undefined,
    };
  }

  const reference = pickSendchampReference((result.data ?? {}) as Record<string, unknown>);
  if (!reference) {
    return { ok: false, error: "Sendchamp did not return a verification reference", status: 502 };
  }

  return { ok: true, reference, expiresMinutes };
}

/**
 * @deprecated Prefer createSendchampVerificationOtp with channel whatsapp.
 * Always forces WhatsApp so SMS Verification API is never used accidentally.
 */
export async function createSendchampWhatsappVerification(params: {
  phoneIntl: string;
  purpose: SendchampVerificationPurpose;
  email?: string;
}): Promise<
  | { ok: true; reference: string; expiresMinutes: number }
  | { ok: false; error: string; status: number; code?: "provider_auth_failed" }
> {
  return createSendchampVerificationOtp({
    ...params,
    channel: "whatsapp",
    inAppToken: false,
  });
}

export async function confirmSendchampVerification(params: {
  reference: string;
  code: string;
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const result = await post("/verification/confirm", {
    verification_reference: params.reference,
    verification_code: params.code.trim(),
  });

  if (!result.ok) {
    const status = result.status === 401 ? 503 : result.status ?? 400;
    return { ok: false, error: result.error, status };
  }

  return { ok: true };
}
