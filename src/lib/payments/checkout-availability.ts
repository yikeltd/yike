import {
  getPaystackSecretKey,
  isPaystackConfigured,
  isPaymentsRuntimeEnabled,
} from "@/lib/payments/config";
import {
  guardLocalPaymentMutation,
  isLocalDevelopmentRuntime,
} from "@/lib/dev/runtime-safety";

export type WalletTopupCheckoutStatus = {
  available: boolean;
  /** Short user-facing message when checkout is disabled */
  message: string | null;
  /** Diagnostic detail for logs / non-production tooling */
  reasonCode:
    | "paystack_unconfigured"
    | "payments_disabled"
    | "live_paystack_blocked"
    | "production_db_blocked"
    | "ready";
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

  if (isLocalDevelopmentRuntime()) {
    const guard = guardLocalPaymentMutation(getPaystackSecretKey());
    if (!guard.ok) {
      const message =
        guard.code === "live_paystack_blocked"
          ? "Live Paystack checkout is blocked in local development. Use test keys, or enable dev test credits when configured."
          : guard.error;
      return {
        available: false,
        message,
        reasonCode:
          guard.code === "live_paystack_blocked"
            ? "live_paystack_blocked"
            : "production_db_blocked",
      };
    }
  }

  return { available: true, message: null, reasonCode: "ready" };
}
