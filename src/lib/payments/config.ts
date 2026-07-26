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
 * Must only show Processing / poll status — never activate from this alone.
 */
export function getPaymentCallbackUrl(): string {
  const configured = process.env.PAYSTACK_CALLBACK_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return `${getSiteBaseUrl()}/payments/callback`;
}

/** Documented webhook URL for Paystack dashboard (preferred). */
export function getPaymentWebhookUrl(): string {
  const configured = process.env.PAYSTACK_WEBHOOK_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return `${getSiteBaseUrl()}/api/payments/webhook`;
}

export function getPaystackBaseUrl(): string {
  const raw = process.env.PAYSTACK_BASE_URL?.trim() || "https://api.paystack.co";
  return raw.replace(/\/$/, "");
}

export function getPaymentCurrency(): string {
  return (process.env.PAYMENT_CURRENCY?.trim() || "NGN").toUpperCase();
}

/**
 * Active gateway. PAYMENT_GATEWAY preferred; PAYMENT_PROVIDER kept for compatibility.
 */
export function getDefaultPaymentProvider(): PaymentProviderName {
  const raw = (
    process.env.PAYMENT_GATEWAY?.trim() ||
    process.env.PAYMENT_PROVIDER?.trim() ||
    "paystack"
  ).toLowerCase();

  if (raw === "safehaven") return "safehaven";
  if (raw === "flutterwave") return "flutterwave";
  if (raw === "monnify") return "monnify";
  if (raw === "stripe") return "stripe";
  if (raw === "wallet") return "wallet";
  return "paystack";
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

export function isPaymentsRuntimeEnabled(): boolean {
  return envFlag("ENABLE_FEATURED_PAYMENTS", false) && isPaystackConfigured();
}
