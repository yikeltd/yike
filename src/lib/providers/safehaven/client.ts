import { createHmac, timingSafeEqual } from "crypto";
import {
  getSafeHavenConfig,
  isSafeHavenConfigured,
  getSafeHavenConfigSummary,
  validateSafeHavenEnvForRuntime,
} from "./config";
import { getSafeHavenAccessToken } from "./oauth";
import { mapSafeHavenHttpError, safeHavenPublicMessage } from "./errors";
import { logSafeHavenEvent } from "./logging";
import type {
  SafeHavenProviderResult,
  SafeHavenTransferPayload,
  SafeHavenVirtualAccountPayload,
  SafeHavenWebhookEvent,
} from "./types";

export {
  getSafeHavenConfig,
  isSafeHavenConfigured,
  getSafeHavenConfigSummary,
  validateSafeHavenEnvForRuntime,
};

export { getSafeHavenAccessToken };

const FETCH_TIMEOUT_MS = 25_000;

async function safeHavenRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: Record<string, unknown>;
    idempotencyKey?: string;
  } = {}
): Promise<SafeHavenProviderResult<T>> {
  const config = getSafeHavenConfig();

  if (!isSafeHavenConfigured()) {
    return {
      ok: false,
      code: "provider_not_configured",
      error: safeHavenPublicMessage("provider_not_configured"),
    };
  }

  const token = await getSafeHavenAccessToken(config);
  if (!token) {
    return {
      ok: false,
      code: "provider_auth_failed",
      error: safeHavenPublicMessage("provider_auth_failed"),
    };
  }

  const url = `${config.baseUrl!.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const res = await fetch(url, {
      method: options.method ?? "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `${token.tokenType} ${token.accessToken}`,
        ...(options.idempotencyKey
          ? { "Idempotency-Key": options.idempotencyKey }
          : {}),
        ...(config.businessId ? { "X-Business-Id": config.businessId } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    const data = (await res.json().catch(() => ({}))) as T & Record<string, unknown>;

    if (!res.ok) {
      const code = mapSafeHavenHttpError(res.status);
      return {
        ok: false,
        code,
        error: safeHavenPublicMessage(code),
      };
    }

    return { ok: true, data };
  } catch (err) {
    logSafeHavenEvent("safehaven_health_check", {
      path,
      error: err instanceof Error ? err.message : "network_error",
    });
    return {
      ok: false,
      code: "provider_unavailable",
      error: safeHavenPublicMessage("provider_unavailable"),
    };
  }
}

export async function createSafeHavenVirtualAccount(
  payload: SafeHavenVirtualAccountPayload
): Promise<SafeHavenProviderResult<Record<string, unknown>>> {
  const vaPath =
    process.env.SAFEHAVEN_VA_CREATE_PATH?.trim() || "/virtual-accounts";

  return safeHavenRequest<Record<string, unknown>>(vaPath, {
    method: "POST",
    idempotencyKey: payload.idempotencyKey,
    body: {
      accountName: payload.accountName,
      email: payload.email ?? undefined,
      phone: payload.phone ?? undefined,
      externalReference: payload.userId,
      ...(getSafeHavenConfig().businessId
        ? { businessId: getSafeHavenConfig().businessId }
        : {}),
    },
  });
}

export async function getSafeHavenAccountBalance(): Promise<
  SafeHavenProviderResult<Record<string, unknown>>
> {
  const path =
    process.env.SAFEHAVEN_BALANCE_PATH?.trim() || "/accounts/balance";
  return safeHavenRequest<Record<string, unknown>>(path, { method: "GET" });
}

export async function verifySafeHavenTransaction(
  reference: string
): Promise<SafeHavenProviderResult<Record<string, unknown>>> {
  const pathTemplate =
    process.env.SAFEHAVEN_VERIFY_TX_PATH?.trim() ||
    "/transactions/{reference}";
  const path = pathTemplate.replace("{reference}", encodeURIComponent(reference));
  return safeHavenRequest<Record<string, unknown>>(path, { method: "GET" });
}

export async function initiateSafeHavenTransfer(
  payload: SafeHavenTransferPayload
): Promise<SafeHavenProviderResult<Record<string, unknown>>> {
  const path =
    process.env.SAFEHAVEN_TRANSFER_PATH?.trim() || "/transfers";
  return safeHavenRequest<Record<string, unknown>>(path, {
    method: "POST",
    idempotencyKey: payload.idempotencyKey,
    body: {
      amount: payload.amount,
      narration: payload.narration,
      destinationAccount: payload.destinationAccount,
      destinationBankCode: payload.destinationBankCode,
    },
  });
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return null;
}

function pickNumber(obj: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "number" && Number.isFinite(val)) return val;
    if (typeof val === "string" && val.trim() && !Number.isNaN(Number(val))) {
      return Number(val);
    }
  }
  return null;
}

export function parseSafeHavenWebhook(
  payload: unknown,
  _headers: Headers
): SafeHavenWebhookEvent | null {
  if (!payload || typeof payload !== "object") return null;
  const raw = payload as Record<string, unknown>;
  const data =
    raw.data && typeof raw.data === "object"
      ? (raw.data as Record<string, unknown>)
      : raw;

  return {
    eventId: pickString(raw, ["eventId", "event_id", "id"]) ?? pickString(data, ["id"]),
    eventType:
      pickString(raw, ["eventType", "event_type", "type"]) ??
      pickString(data, ["type"]),
    providerReference:
      pickString(raw, ["providerReference", "provider_reference", "reference"]) ??
      pickString(data, ["reference", "providerReference"]),
    transactionReference:
      pickString(raw, ["transactionReference", "transaction_reference"]) ??
      pickString(data, ["transactionReference", "reference"]),
    amount: pickNumber(raw, ["amount"]) ?? pickNumber(data, ["amount"]),
    status: pickString(raw, ["status"]) ?? pickString(data, ["status"]),
    raw: raw as Record<string, unknown>,
  };
}

export function verifySafeHavenWebhook(
  rawBody: string,
  headers: Headers
): { ok: true } | { ok: false; code: "webhook_signature_invalid" | "provider_not_configured" } {
  const config = getSafeHavenConfig();
  const secret = config.webhookSecret;

  if (!secret) {
    return { ok: true };
  }

  const signatureHeader =
    process.env.SAFEHAVEN_WEBHOOK_SIGNATURE_HEADER?.trim() ||
    "x-safehaven-signature";

  const signature =
    headers.get(signatureHeader) ??
    headers.get("x-webhook-signature") ??
    headers.get("x-sudo-signature");

  if (!signature) {
    return { ok: false, code: "webhook_signature_invalid" };
  }

  try {
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const normalized = signature.replace(/^sha256=/i, "").trim();
    const a = Buffer.from(normalized);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, code: "webhook_signature_invalid" };
    }
    return { ok: true };
  } catch {
    return { ok: false, code: "webhook_signature_invalid" };
  }
}
