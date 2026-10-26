export type PaymentCallbackPhase =
  | "missing"
  | "processing"
  | "verification_unavailable"
  | "failed"
  | "cancelled";

export type VerifyPollPayload = {
  ok?: boolean;
  status?: string;
  error?: string;
  code?: string;
};

export type ReconcilePollPayload = {
  ok?: boolean;
  error?: string;
  code?: string;
  walletTopup?: { coinsCredited?: number | null; balanceAfter?: number | null } | null;
};

export function paymentStatusToPhase(status: string | undefined): PaymentCallbackPhase {
  if (!status) return "processing";
  if (status === "successful") return "processing";
  if (status === "failed") return "failed";
  if (status === "cancelled" || status === "refunded") return "cancelled";
  return "processing";
}

export function mapVerifyHttpToPhase(
  httpStatus: number,
  payload: VerifyPollPayload,
): PaymentCallbackPhase {
  if (httpStatus === 503) return "verification_unavailable";
  if (httpStatus === 502) return "verification_unavailable";
  if (httpStatus === 404) return "failed";
  if (httpStatus === 403) return "failed";
  if (!payload.ok || !payload.status) return "processing";
  return paymentStatusToPhase(payload.status);
}

/** Drive server-side Paystack verify + fulfilment when status poll stays pending. */
export function shouldAttemptReconcile(pollIndex: number): boolean {
  return pollIndex > 0 && pollIndex % 2 === 0;
}

export function reconcileHttpIndicatesUnavailable(httpStatus: number, code?: string): boolean {
  if (httpStatus === 503) return true;
  if (httpStatus === 502 || code === "verify_failed") return true;
  return false;
}
