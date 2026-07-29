import type { PaymentProviderName } from "@/lib/payments/types";

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return defaultValue;
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return defaultValue;
}

export function getSiteBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://yike.ng";
  const withProtocol = raw.startsWith("http") ? raw : `https://${raw}`;
  return withProtocol.replace(/\/$/, "");
}

/**
 * Browser return URL after Paystack Checkout.
 */
export function getPaymentCallbackUrl(): string {
  const configured = process.env.PAYSTACK_CALLBACK_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return `${getSiteBaseUrl()}/payments/callback`;
}

/** Documented webhook URL for Paystack dashboard. */
export function getPaymentWebhookUrl(): string {
  const configured = process.env.PAYSTACK_WEBHOOK_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return `${getSiteBaseUrl()}/api/webhooks/paystack`;
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
  const configured = process.env.KORAPAY_CALLBACK_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return `${getSiteBaseUrl()}/payments/korapay/callback`;
}

export function getKorapayWebhookUrl(): string {
  const configured = process.env.KORAPAY_WEBHOOK_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return `${getSiteBaseUrl()}/api/webhooks/korapay`;
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
