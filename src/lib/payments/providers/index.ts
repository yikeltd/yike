import type { PaymentProvider } from "@/lib/payments/providers/types";
import type { PaymentProviderName } from "@/lib/payments/types";
import { getDefaultPaymentProvider } from "@/lib/payments/config";
import { paystackProvider } from "@/lib/payments/providers/paystack";
import { safehavenPaymentProvider } from "@/lib/payments/providers/safehaven";

export function resolvePaymentProvider(name?: PaymentProviderName): PaymentProvider {
  const providerName = name ?? getDefaultPaymentProvider();
  if (providerName === "safehaven") return safehavenPaymentProvider;
  return paystackProvider;
}
