import type { PaymentProvider } from "@/lib/payments/providers/types";
import type {
  InitializePaymentInput,
  InitializePaymentResult,
  PaymentProviderName,
  VerifyPaymentResult,
} from "@/lib/payments/types";

/** Future gateways — interface-ready stubs. Never accept live traffic until implemented. */
export function createStubPaymentProvider(name: PaymentProviderName): PaymentProvider {
  const label = name.charAt(0).toUpperCase() + name.slice(1);

  return {
    name,

    isConfigured(): boolean {
      return false;
    },

    async initializePayment(_input: InitializePaymentInput): Promise<InitializePaymentResult> {
      return {
        ok: false,
        error: `${label} payments are not enabled yet`,
      };
    },

    async verifyPayment(_reference: string): Promise<VerifyPaymentResult> {
      return { ok: false, error: `${label} payments are not enabled yet` };
    },

    verifyWebhookSignature(): boolean {
      return false;
    },
  };
}
