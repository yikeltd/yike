import type { PaymentProviderName } from "@/lib/payments/types";

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return defaultValue;
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return defaultValue;
}

export function getSiteBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    "https://yike.ng";
  const withProtocol = raw.startsWith("http") ? raw : `https://${raw}`;
  return withProtocol.replace(/\/$/, "");
}

export function getPaymentCallbackUrl(): string {
  return `${getSiteBaseUrl()}/payments/verify`;
}

export function getDefaultPaymentProvider(): PaymentProviderName {
  const raw = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();
  if (raw === "safehaven") return "safehaven";
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
