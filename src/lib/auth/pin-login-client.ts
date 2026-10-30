import { AUTH_USER_MESSAGES } from "@/constants/auth-messages";
import type { PinLoginGateReason } from "@/lib/auth/pin-login-gate.types";

export const PIN_PREFLIGHT_TIMEOUT_MS = 12_000;
export const PIN_SUBMIT_TIMEOUT_MS = 20_000;
/** Short client cache — PIN submit still enforced server-side. */
export const PIN_PREFLIGHT_CLIENT_CACHE_MS = 20_000;

type PreflightCacheEntry = { data: PinPreflightResponse; at: number };
const preflightResultCache = new Map<string, PreflightCacheEntry>();

function preflightCacheKey(identifier: string): string {
  return identifier.trim().toLowerCase();
}

export function readCachedPinPreflight(identifier: string): PinPreflightResponse | null {
  const key = preflightCacheKey(identifier);
  const entry = preflightResultCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > PIN_PREFLIGHT_CLIENT_CACHE_MS) {
    preflightResultCache.delete(key);
    return null;
  }
  return entry.data;
}

export function clearPinPreflightCache(identifier?: string): void {
  if (!identifier) {
    preflightResultCache.clear();
    return;
  }
  preflightResultCache.delete(preflightCacheKey(identifier));
}

export type PinClientFailureKind =
  | "network"
  | "timeout"
  | "aborted"
  | "server"
  | "rate_limit"
  | "auth"
  | "unknown";

export type PinPreflightResponse = {
  canUsePin?: boolean;
  step?: string;
  reason?: PinLoginGateReason;
  pinLocked?: boolean;
  message?: string;
  error?: string;
};

export type PinPreflightResult =
  | { ok: true; data: PinPreflightResponse }
  | {
      ok: false;
      kind: PinClientFailureKind;
      message: string;
      status?: number;
      data?: PinPreflightResponse;
    };

export type PinLoginResponse = {
  ok?: boolean;
  error?: string;
  requiresPassword?: boolean;
  reason?: PinLoginGateReason;
  pinLocked?: boolean;
  profile?: {
    id: string;
    email: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
};

export type PinLoginResult =
  | { ok: true; data: PinLoginResponse }
  | { ok: false; kind: PinClientFailureKind; message: string; status?: number; data?: PinLoginResponse };

function classifyHttpFailure(status: number, body: { error?: string }): PinLoginResult {
  const serverMessage = body.error?.trim();
  if (status === 429) {
    return {
      ok: false,
      kind: "rate_limit",
      status,
      message: serverMessage ?? AUTH_USER_MESSAGES.pinLocked,
      data: body,
    };
  }
  if (status === 401 || status === 403) {
    return {
      ok: false,
      kind: "auth",
      status,
      message: serverMessage ?? AUTH_USER_MESSAGES.pinIncorrect,
      data: body,
    };
  }
  if (status >= 500) {
    return {
      ok: false,
      kind: "server",
      status,
      message: serverMessage ?? AUTH_USER_MESSAGES.pinDeviceCheckFailed,
      data: body,
    };
  }
  return {
    ok: false,
    kind: "unknown",
    status,
    message: serverMessage ?? AUTH_USER_MESSAGES.pinDeviceCheckFailed,
    data: body,
  };
}

function classifyFetchError(error: unknown, signal?: AbortSignal): PinClientFailureKind {
  if (signal?.aborted) return "aborted";
  if (error instanceof DOMException && error.name === "AbortError") {
    return signal?.aborted ? "aborted" : "timeout";
  }
  if (error instanceof Error && error.name === "AbortError") {
    return signal?.aborted ? "aborted" : "timeout";
  }
  return "network";
}

export function messageForPinFailureKind(kind: PinClientFailureKind): string {
  switch (kind) {
    case "timeout":
      return "This is taking too long. Check your connection and try again, or use your password.";
    case "network":
      return "We could not reach Yike. Check your connection and try again, or use your password.";
    case "server":
      return AUTH_USER_MESSAGES.pinDeviceCheckFailed;
    case "rate_limit":
      return AUTH_USER_MESSAGES.pinLocked;
    case "auth":
      return AUTH_USER_MESSAGES.pinIncorrect;
    default:
      return AUTH_USER_MESSAGES.pinDeviceCheckFailed;
  }
}

async function fetchJsonWithTimeout<T>(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<
  | { ok: true; status: number; data: T }
  | { ok: false; kind: PinClientFailureKind; status?: number; data?: T }
> {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const abortExternal = () => controller.abort();
  signal?.addEventListener("abort", abortExternal, { once: true });

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    const data = (await res.json().catch(() => ({}))) as T;
    return { ok: true, status: res.status, data };
  } catch (error) {
    if (timedOut) {
      return { ok: false, kind: "timeout" };
    }
    if (signal?.aborted) {
      return { ok: false, kind: "aborted" };
    }
    const kind = classifyFetchError(error, controller.signal);
    return { ok: false, kind: kind === "aborted" ? "network" : kind };
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortExternal);
  }
}

export async function requestPinPreflight(params: {
  identifier: string;
  signal?: AbortSignal;
  bypassCache?: boolean;
}): Promise<PinPreflightResult> {
  const key = preflightCacheKey(params.identifier);
  if (!params.bypassCache) {
    const cached = readCachedPinPreflight(params.identifier);
    if (cached) return { ok: true, data: cached };
  }

  const result = await fetchJsonWithTimeout<PinPreflightResponse>(
    "/api/auth/pin/preflight",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: params.identifier }),
    },
    PIN_PREFLIGHT_TIMEOUT_MS,
    params.signal
  );

  if (!result.ok) {
    if (result.kind === "aborted") {
      return { ok: false, kind: "aborted", message: "" };
    }
    return {
      ok: false,
      kind: result.kind,
      message: messageForPinFailureKind(result.kind),
      status: result.status,
    };
  }

  if (result.status >= 400) {
    const body = result.data ?? {};
    return {
      ok: false,
      kind: result.status === 429 ? "rate_limit" : "server",
      status: result.status,
      message: body.error?.trim() ?? AUTH_USER_MESSAGES.pinDeviceCheckFailed,
      data: body,
    };
  }

  if (result.data.canUsePin) {
    preflightResultCache.set(key, { data: result.data, at: Date.now() });
  }
  return { ok: true, data: result.data };
}

export async function requestPinLogin(params: {
  identifier: string;
  pin: string;
  signal?: AbortSignal;
}): Promise<PinLoginResult> {
  const result = await fetchJsonWithTimeout<PinLoginResponse>(
    "/api/auth/pin/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: params.identifier, pin: params.pin }),
    },
    PIN_SUBMIT_TIMEOUT_MS,
    params.signal
  );

  if (!result.ok) {
    return {
      ok: false,
      kind: result.kind,
      message: messageForPinFailureKind(result.kind),
      status: result.status,
    };
  }

  const body = result.data ?? {};
  if (result.status >= 400) {
    const classified = classifyHttpFailure(result.status, body);
    return { ...classified, data: body };
  }

  return { ok: true, data: body };
}

/** Ignore stale async results when generation counters diverge. */
export function shouldApplyPinAsyncResult(
  requestGeneration: number,
  activeGeneration: number
): boolean {
  return requestGeneration === activeGeneration;
}
