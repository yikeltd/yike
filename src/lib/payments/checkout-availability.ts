import { isPaystackConfigured, isPaymentsRuntimeEnabled } from "@/lib/payments/config";

export type WalletTopupCheckoutStatus = {
  available: boolean;
  /** Short user-facing message when checkout is disabled */
  message: string | null;
  /** Diagnostic detail for logs / non-production tooling */
  reasonCode: "paystack_unconfigured" | "payments_disabled" | "ready";
};

export function getWalletTopupCheckoutStatus(): WalletTopupCheckoutStatus {
  if (!isPaystackConfigured()) {
    return {
      available: false,
      message: "Top-up checkout isn’t set up on this environment yet.",
      reasonCode: "paystack_unconfigured",
    };
  }
  if (!isPaymentsRuntimeEnabled()) {
    return {
      available: false,
      message:
        "Top-up checkout is off until payments are enabled for this environment.",
      reasonCode: "payments_disabled",
    };
  }
  return { available: true, message: null, reasonCode: "ready" };
}
