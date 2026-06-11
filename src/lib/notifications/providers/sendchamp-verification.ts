import {
  isSendchampSuccess,
  pickSendchampReference,
  sendchampErrorMessage,
  type SendchampEnvelope,
} from "./sendchamp-response";
import { looksLikeSupabaseKey } from "./sendchamp-keys";
import { toSendchampPhone } from "./sendchamp";

const DEFAULT_BASE_URL = "https://api.sendchamp.com/api/v1";
const FETCH_TIMEOUT_MS = 25_000;

export type SendchampVerificationPurpose =
  | "account_verification"
  | "whatsapp_number_verification";

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

function otpLength(): number {
  const n = Number(process.env.SENDCHAMP_OTP_LENGTH ?? process.env.WHATSAPP_OTP_LENGTH ?? 6);
  return Number.isFinite(n) && n >= 4 && n <= 8 ? n : 6;
}

function otpExpiryMinutes(): number {
  const n = Number(
    process.env.SENDCHAMP_OTP_EXPIRY_MINUTES ?? process.env.WHATSAPP_OTP_EXPIRY_MINUTES ?? 30
  );
  return Number.isFinite(n) && n >= 5 && n <= 60 ? n : 30;
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

/** Sendchamp generates and delivers the OTP (in_app_token: false). */
export async function createSendchampWhatsappVerification(params: {
  phoneIntl: string;
  purpose: SendchampVerificationPurpose;
  email?: string;
}): Promise<
  | { ok: true; reference: string; expiresMinutes: number }
  | { ok: false; error: string; status: number; code?: "provider_auth_failed" }
> {
  const channel =
    process.env.SENDCHAMP_OTP_CHANNEL?.trim().toLowerCase() ||
    process.env.WHATSAPP_OTP_CHANNEL?.trim().toLowerCase() ||
    "whatsapp";

  const result = await post("/verification/create", {
    channel,
    token_type: "numeric",
    token_length: otpLength(),
    expiration_time: otpExpiryMinutes(),
    customer_mobile_number: params.phoneIntl,
    customer_email_address: params.email?.trim() || "",
    meta_data: {
      app: "Yike",
      brand: "Yike",
      purpose: params.purpose,
    },
    in_app_token: false,
  });

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

  return { ok: true, reference, expiresMinutes: otpExpiryMinutes() };
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
