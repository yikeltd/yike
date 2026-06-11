import type { PaymentProvider } from "@/lib/payments/providers/types";
import type {
  InitializePaymentInput,
  InitializePaymentResult,
  VerifyPaymentResult,
} from "@/lib/payments/types";
import { isSafeHavenConfigured } from "@/lib/providers/safehaven/config";

/**
 * Safe Haven payment provider — same interface as Paystack.
 * Not active for checkout yet; plugs into payment-service without business-logic changes.
 */
export const safehavenPaymentProvider: PaymentProvider = {
  name: "safehaven",

  isConfigured(): boolean {
    return isSafeHavenConfigured();
  },

  async initializePayment(_input: InitializePaymentInput): Promise<InitializePaymentResult> {
    return {
      ok: false,
      error: "Safe Haven payments are not enabled yet",
    };
  },

  async verifyPayment(_reference: string): Promise<VerifyPaymentResult> {
    return { ok: false, error: "Safe Haven payments are not enabled yet" };
  },
};
