/**
 * Shared client auth HTTP helpers — timeouts, stale-response guards, error kinds.
 */

export const AUTH_REQUEST_DEFAULT_TIMEOUT_MS = 12_000;
export const AUTH_PIN_SUBMIT_TIMEOUT_MS = 20_000;

export type AuthClientFailureKind =
  | "network"
  | "timeout"
  | "server"
  | "rate_limit"
  | "auth"
  | "unavailable"
  | "unknown";

export type AuthJsonResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; kind: AuthClientFailureKind; status?: number; message: string; data?: T };

function classifyFetchError(error: unknown): AuthClientFailureKind {
  if (error instanceof DOMException && error.name === "AbortError") return "timeout";
  if (error instanceof Error && error.name === "AbortError") return "timeout";
  return "network";
}

export function shouldApplyAsyncResult(
  requestGeneration: number,
  activeGeneration: number
): boolean {
  return requestGeneration === activeGeneration;
}

export function messageForAuthFailureKind(
  kind: AuthClientFailureKind,
  fallback: string
): string {
  switch (kind) {
    case "timeout":
      return "This is taking too long. Check your connection and try again.";
    case "network":
      return "We could not reach Yike. Check your connection and try again.";
    case "rate_limit":
      return "Too many attempts. Please wait a moment and try again.";
    case "unavailable":
      return "Sign-in is temporarily unavailable. Try again shortly.";
    case "auth":
      return fallback;
    default:
      return fallback;
  }
}

export async function fetchAuthJson<T>(
  url: string,
  init: RequestInit,
  timeoutMs: number = AUTH_REQUEST_DEFAULT_TIMEOUT_MS,
  signal?: AbortSignal
): Promise<AuthJsonResult<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const abortExternal = () => controller.abort();
  signal?.addEventListener("abort", abortExternal, { once: true });

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    const data = (await res.json().catch(() => ({}))) as T;
    if (!res.ok) {
      const body = data as { error?: string };
      const kind: AuthClientFailureKind =
        res.status === 429
          ? "rate_limit"
          : res.status === 503
            ? "unavailable"
            : res.status === 401 || res.status === 403
              ? "auth"
              : res.status >= 500
                ? "server"
                : "unknown";
      return {
        ok: false,
        kind,
        status: res.status,
        message: body.error?.trim() || messageForAuthFailureKind(kind, "Request failed"),
        data,
      };
    }
    return { ok: true, status: res.status, data };
  } catch (error) {
    const kind = classifyFetchError(error);
    return {
      ok: false,
      kind,
      message: messageForAuthFailureKind(kind, "Request failed"),
    };
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortExternal);
  }
}
