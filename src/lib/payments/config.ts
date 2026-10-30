import type { PaymentProviderName } from "@/lib/payments/types";
import { isLocalDevelopmentRuntime } from "@/lib/dev/runtime-safety";

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return defaultValue;
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return defaultValue;
}

export function getSiteBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    const withProtocol = configured.startsWith("http") ? configured : `https://${configured}`;
    const normalized = withProtocol.replace(/\/$/, "");
    if (
      isLocalDevelopmentRuntime() &&
      /^https?:\/\/(www\.)?yike\.ng$/i.test(normalized)
    ) {
      const port = process.env.PORT?.trim() || "3000";
      return `http://localhost:${port}`;
    }
    return normalized;
  }

  if (process.env.NODE_ENV === "development") {
    const port = process.env.PORT?.trim() || "3000";
    return `http://localhost:${port}`;
  }

  const raw = "https://yike.ng";
  const withProtocol = raw.startsWith("http") ? raw : `https://${raw}`;
  return withProtocol.replace(/\/$/, "");
}

const PRODUCTION_HOST_PATTERN = /^https?:\/\/(www\.)?yike\.ng/i;

/**
 * Resolve an absolute URL for the current runtime.
 * In local dev, production host env values fall back to the local origin + path.
 */
export function resolveAppAbsoluteUrlForRuntime(
  siteBaseUrl: string,
  configured: string | undefined,
  defaultPath: string,
  localDev: boolean,
): string {
  const base = siteBaseUrl.replace(/\/$/, "");
  const path = defaultPath.startsWith("/") ? defaultPath : `/${defaultPath}`;

  const trimmed = configured?.trim();
  if (!trimmed) {
    return `${base}${path}`;
  }

  const absolute = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  const withoutTrailing = absolute.replace(/\/$/, "");

  if (localDev && PRODUCTION_HOST_PATTERN.test(withoutTrailing)) {
    try {
      const parsed = new URL(withoutTrailing);
      return `${base}${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return `${base}${path}`;
    }
  }

  return withoutTrailing;
}

export function resolveAppAbsoluteUrl(
  configured: string | undefined,
  defaultPath: string,
): string {
  return resolveAppAbsoluteUrlForRuntime(
    getSiteBaseUrl(),
    configured,
    defaultPath,
    isLocalDevelopmentRuntime(),
  );
}

/**
 * Browser return URL after Paystack Checkout.
 */
export function getPaymentCallbackUrl(): string {
  return resolveAppAbsoluteUrl(
    process.env.PAYSTACK_CALLBACK_URL,
    "/payments/callback",
  );
}

/** Documented webhook URL for Paystack dashboard. */
export function getPaymentWebhookUrl(): string {
  return resolveAppAbsoluteUrl(
    process.env.PAYSTACK_WEBHOOK_URL,
    "/api/webhooks/paystack",
  );
}

export function getPaystackBaseUrl(): string {
  const raw = process.env.PAYSTACK_BASE_URL?.trim() || "https://api.paystack.co";
  return raw.replace(/\/$/, "");
}

export function isPaystackConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY?.trim());
}

export function getPaystackSecretKey(): string | null {
  return process.env.PAYSTACK_SECRET_KEY?.trim() || null;
}

export function getPaystackPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim() || null;
}

/** True when secret key is Paystack test mode (sk_test_*). */
export function isPaystackTestSecretKey(secret?: string | null): boolean {
  const key = (secret ?? getPaystackSecretKey())?.trim() ?? "";
  return key.startsWith("sk_test_");
}

/** True when public key is Paystack test mode (pk_test_*). */
export function isPaystackTestPublicKey(publicKey?: string | null): boolean {
  const key = (publicKey ?? getPaystackPublicKey())?.trim() ?? "";
  return key.startsWith("pk_test_");
}

export type PaystackTestModeCheck =
  | { ok: true; mode: "test" }
  | { ok: false; reason: string };

/**
 * Automated checkout / webhook replay tests must use Paystack test keys only.
 * Never run scripted charges with sk_live_* unless explicitly overridden.
 */
export function requirePaystackTestModeForAutomation(): PaystackTestModeCheck {
  const secret = getPaystackSecretKey();
  if (!secret) {
    return { ok: false, reason: "PAYSTACK_SECRET_KEY is not configured" };
  }
  if (secret.startsWith("sk_live_")) {
    const override = process.env.YIKE_ALLOW_LIVE_PAYSTACK_IN_DEV?.trim().toLowerCase();
    if (override === "1" || override === "true") {
      return { ok: false, reason: "Live Paystack keys are blocked for automated checkout tests" };
    }
    return { ok: false, reason: "Live Paystack secret key — use sk_test_* for automation" };
  }
  if (!secret.startsWith("sk_test_")) {
    return { ok: false, reason: "Unrecognized Paystack secret key prefix" };
  }
  const pub = getPaystackPublicKey();
  if (pub && !pub.startsWith("pk_test_")) {
    return { ok: false, reason: "Public key must be pk_test_* when running Paystack automation" };
  }
  return { ok: true, mode: "test" };
}

/* ============================================================================
 * KORAPAY CONFIGURATION & HELPERS
 * ============================================================================ */

export function getKorapayBaseUrl(): string {
  const raw = process.env.KORAPAY_BASE_URL?.trim() || "https://api.korapay.com";
  return raw.replace(/\/$/, "");
}

export function isKorapayConfigured(): boolean {
  return Boolean(process.env.KORAPAY_SECRET_KEY?.trim());
}

export function getKorapaySecretKey(): string | null {
  return process.env.KORAPAY_SECRET_KEY?.trim() || null;
}

export function getKorapayPublicKey(): string | null {
  return (
    process.env.NEXT_PUBLIC_KORAPAY_PUBLIC_KEY?.trim() ||
    process.env.KORAPAY_PUBLIC_KEY?.trim() ||
    null
  );
}

export function getKorapayCallbackUrl(): string {
  return resolveAppAbsoluteUrl(
    process.env.KORAPAY_CALLBACK_URL,
    "/payments/korapay/callback",
  );
}

export function getKorapayWebhookUrl(): string {
  return resolveAppAbsoluteUrl(
    process.env.KORAPAY_WEBHOOK_URL,
    "/api/webhooks/korapay",
  );
}

/* ============================================================================
 * GENERAL PAYMENT GATEWAY RESOLUTION
 * ============================================================================ */

export function getPaymentCurrency(): string {
  return (process.env.PAYMENT_CURRENCY?.trim() || "NGN").toUpperCase();
}

export function getDefaultPaymentProvider(): PaymentProviderName {
  const raw = (
    process.env.PAYMENT_GATEWAY?.trim() ||
    process.env.PAYMENT_PROVIDER?.trim() ||
    "paystack"
  ).toLowerCase();

  if (raw === "korapay" && isKorapayConfigured()) return "korapay";
  if (raw === "paystack" && isPaystackConfigured()) return "paystack";

  // Fallback to whichever provider is configured
  if (isPaystackConfigured()) return "paystack";
  if (isKorapayConfigured()) return "korapay";

  return "paystack";
}

export function isAnyPaymentProviderConfigured(): boolean {
  return isPaystackConfigured() || isKorapayConfigured();
}

export function isPaymentsRuntimeEnabled(): boolean {
  const flag =
    envFlag("ENABLE_PAYMENTS", false) ||
    envFlag("ENABLE_FEATURED_PAYMENTS", false) ||
    isAnyPaymentProviderConfigured();
  return flag && isAnyPaymentProviderConfigured();
}
