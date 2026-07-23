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
