/**
 * Security Headers & Protection Policy — Phase 1.8 Production Hardening
 *
 * Defines standard security headers applied to HTTP requests/responses for production readiness.
 */

export const SECURITY_HEADERS: Record<string, string> = {
  "X-DNS-Prefetch-Control": "on",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
  "X-XSS-Protection": "1; mode=block",
};

/** Apply security headers to response headers object */
export function applySecurityHeaders(headers: Headers): Headers {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
  return headers;
}
