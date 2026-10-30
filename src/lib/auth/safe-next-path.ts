import { CONSUMER_ROUTES } from "@/lib/navigation/consumer-routes";

/** Default post-auth destination for consumer login/signup (not `/saved`). */
export const CONSUMER_AUTH_DEFAULT_NEXT = CONSUMER_ROUTES.profile;

const STAFF_NEXT_PREFIXES = ["/lex", "/staff"] as const;

/**
 * Allow only same-origin relative paths for post-auth redirects.
 * Blocks protocol-relative URLs (//evil.com), absolute URLs, and backslash tricks.
 */
export function safeNextPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;

  let trimmed = raw.trim();
  if (!trimmed) return fallback;

  // Decode once to catch encoded protocol-relative tricks (/%2f%2fevil.com).
  try {
    trimmed = decodeURIComponent(trimmed);
  } catch {
    return fallback;
  }

  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("\\")) return fallback;
  if (/[\r\n\0]/.test(trimmed)) return fallback;
  // Disallow scheme-like payloads inside the path.
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed.slice(1))) return fallback;

  try {
    const url = new URL(trimmed, "https://yike.ng");
    if (url.origin !== "https://yike.ng") return fallback;
    if (url.username || url.password) return fallback;

    const path = `${url.pathname}${url.search}${url.hash}`;
    if (!path.startsWith("/") || path.startsWith("//")) return fallback;
    return path || fallback;
  } catch {
    return fallback;
  }
}

/** Consumer `/auth/login` and `/auth/signup` must not land in staff consoles via `next`. */
export function safeConsumerAuthNext(
  raw: string | null | undefined,
  fallback: string = CONSUMER_AUTH_DEFAULT_NEXT
): string {
  const safe = safeNextPath(raw, fallback);
  const pathOnly = safe.split("?")[0]?.split("#")[0] ?? safe;
  const blocked = STAFF_NEXT_PREFIXES.some(
    (prefix) => pathOnly === prefix || pathOnly.startsWith(`${prefix}/`)
  );
  if (blocked) return fallback;
  return safe;
}
