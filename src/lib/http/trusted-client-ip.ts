import { isProductionEnv } from "@/lib/env";

/**
 * When true (default in production), trust reverse-proxy headers set by Coolify/nginx.
 * Set YIKE_TRUST_PROXY_HEADERS=false for direct local requests without a proxy.
 */
export function shouldTrustProxyHeaders(): boolean {
  const raw = process.env.YIKE_TRUST_PROXY_HEADERS?.trim().toLowerCase();
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return isProductionEnv();
}

/** Server-derived client IP; never trust client-supplied body fields. */
export function clientIpFromRequest(request: Request): string | null {
  if (!shouldTrustProxyHeaders()) {
    return null;
  }

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first && isPlausibleIp(first)) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp && isPlausibleIp(realIp)) return realIp;

  return null;
}

function isPlausibleIp(value: string): boolean {
  if (value.length > 64) return false;
  return /^[\d.a-fA-F:]+$/.test(value);
}
