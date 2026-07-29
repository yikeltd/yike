import type { PaymentProvider } from "@/lib/payments/providers/types";
import type { PaymentProviderName } from "@/lib/payments/types";
import { getDefaultPaymentProvider } from "@/lib/payments/config";
import { paystackProvider } from "@/lib/payments/providers/paystack";
import { korapayProvider } from "@/lib/payments/providers/korapay";
import { safehavenPaymentProvider } from "@/lib/payments/providers/safehaven";
import { createStubPaymentProvider } from "@/lib/payments/providers/stub";

const stubs: Record<
  Exclude<PaymentProviderName, "paystack" | "korapay" | "safehaven">,
  PaymentProvider
> = {
  flutterwave: createStubPaymentProvider("flutterwave"),
  monnify: createStubPaymentProvider("monnify"),
  stripe: createStubPaymentProvider("stripe"),
  wallet: createStubPaymentProvider("wallet"),
};

export function resolvePaymentProvider(name?: PaymentProviderName): PaymentProvider {
  const providerName = name ?? getDefaultPaymentProvider();
  if (providerName === "paystack") return paystackProvider;
  if (providerName === "korapay") return korapayProvider;
  if (providerName === "safehaven") return safehavenPaymentProvider;
  return stubs[providerName] ?? paystackProvider;
}

export function listPaymentProviders(): PaymentProviderName[] {
  return ["paystack", "korapay", "safehaven", "flutterwave", "monnify", "stripe", "wallet"];
}
