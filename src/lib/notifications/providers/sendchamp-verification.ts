import { SENDCHAMP_OTP_META_MESSAGE } from "@/lib/phone-verification/copy";
import {
  logOtpAudit,
  pickResponseHeaders,
  sanitizeSendchampPayload,
} from "@/lib/otp/delivery-audit";
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

type PostOptions = {
  requestId?: string;
  phone?: string;
  /** Billable POSTs must never retry after timeout — Sendchamp may already have charged. */
  billable?: boolean;
};

async function post<T extends Record<string, unknown>>(
  path: string,
  body: Record<string, unknown>,
  options: PostOptions = {}
): Promise<{ ok: true; data: SendchampEnvelope<T> } | { ok: false; error: string; status?: number }> {
  const apiKeys = getApiKeys();
  if (apiKeys.length === 0) {
    return { ok: false, error: "Sendchamp not configured", status: 503 };
  }

  const baseUrl = getBaseUrl();
  let lastError = "Sendchamp request failed";
  let lastStatus = 502;
  const billable =
    options.billable ??
    (path.includes("/verification/create") || path.includes("/sms/"));

  // One key only for billable SMS/OTP — dual keys can double-charge on ambiguous failures.
  const keysToTry = billable ? apiKeys.slice(0, 1) : apiKeys;

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
      lastStatus = res.status;
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
      // Do not try another key after an authenticated HTTP response (may have charged).
      if (res.status === 401) {
        return { ok: false, error: lastError, status: 401 };
      }
      if (billable) {
        return { ok: false, error: lastError, status: lastStatus };
      }
    } catch (err) {
      const timedOut =
        err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
      lastError = timedOut ? "Sendchamp request timed out" : "Sendchamp network error";
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
      // Never retry billable POSTs after timeout — request may already be charged.
      if (billable) {
        return { ok: false, error: lastError, status: 504 };
      }
    }
  }

  return { ok: false, error: lastError, status: lastStatus };
}

export function isSendchampVerificationConfigured(): boolean {
  return getApiKeys().length > 0;
}

/**
 * Create a Sendchamp Verification OTP session and (unless `inAppToken`) deliver it.
 * Production SMS: ONE `/verification/create` call — no `/sms/send` fallback in-process.
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
  requestId?: string;
}): Promise<
  | { ok: true; reference: string; expiresMinutes: number }
  | { ok: false; error: string; status: number; code?: "provider_auth_failed" }
> {
  const channel = resolveChannel(params.channel);
  const expiresMinutes = otpExpiryMinutes();
  const inAppToken = params.inAppToken ?? false;
  const requestId = params.requestId ?? "unknown";

  const buildBody = (includeCustomMessage: boolean) => {
    const meta_data: Record<string, unknown> = {
      app: "Yike",
      brand: "Yike",
      purpose: params.purpose,
      description: "Yike phone verification",
    };
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

    if (channel === "sms") {
      body.sender = resolveSmsSender(process.env.SENDCHAMP_SMS_SENDER ?? "YIKE");
    }

    return body;
  };

  logOtpAudit({
    event: "verification_create_start",
    requestId,
    phone: params.phoneIntl,
    path: "/verification/create",
    requestPayload: sanitizeSendchampPayload(buildBody(true)),
  });

  let result = await post("/verification/create", buildBody(true), {
    requestId,
    phone: params.phoneIntl,
    billable: !inAppToken,
  });

  // Narrow retry: only when Sendchamp explicitly rejects the custom message field.
  // Do NOT match generic "invalid" (phone/sender) — that would double-charge.
  if (
    !result.ok &&
    channel === "sms" &&
    !inAppToken &&
    /meta_data\.?message|custom message|message template/i.test(result.error)
  ) {
    logOtpAudit({
      event: "verification_create_retry_without_message",
      requestId,
      phone: params.phoneIntl,
      error: result.error,
    });
    result = await post("/verification/create", buildBody(false), {
      requestId,
      phone: params.phoneIntl,
      billable: true,
    });
  }

  if (!result.ok) {
    logOtpAudit({
      event: "verification_create_failed",
      requestId,
      phone: params.phoneIntl,
      error: result.error,
    });
    return {
      ok: false,
      error: result.error,
      status: result.status === 401 ? 503 : result.status ?? 502,
      code: result.status === 401 ? "provider_auth_failed" : undefined,
    };
  }

  const envelope = (result.data ?? {}) as Record<string, unknown>;
  const reference = pickSendchampReference(envelope);
  if (!reference) {
    // HTTP success without reference: do NOT call /sms/send — may already be charged.
    logOtpAudit({
      event: "verification_create_missing_reference",
      requestId,
      phone: params.phoneIntl,
      responseBody: envelope,
      error: "Sendchamp did not return a verification reference",
    });
    return {
      ok: false,
      error: "Sendchamp did not return a verification reference",
      status: 502,
    };
  }

  logOtpAudit({
    event: "verification_create_ok",
    requestId,
    phone: params.phoneIntl,
    reference,
    deliveryReference: reference,
    deliveryStatus: String(
      (envelope.data as Record<string, unknown> | undefined)?.status ??
        envelope.status ??
        "ok"
    ),
  });

  return { ok: true, reference, expiresMinutes };
}

/**
 * @deprecated Prefer createSendchampVerificationOtp with channel whatsapp.
 */
export async function createSendchampWhatsappVerification(params: {
  phoneIntl: string;
  purpose: SendchampVerificationPurpose;
  email?: string;
  requestId?: string;
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
  requestId?: string;
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const result = await post(
    "/verification/confirm",
    {
      verification_reference: params.reference,
      verification_code: params.code.trim(),
    },
    { requestId: params.requestId, billable: false }
  );

  if (!result.ok) {
    const status = result.status === 401 ? 503 : result.status ?? 400;
    return { ok: false, error: result.error, status };
  }

  return { ok: true };
}
