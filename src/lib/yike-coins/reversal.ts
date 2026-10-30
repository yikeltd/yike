import { createAdminClient } from "@/lib/supabase/admin";
import type { CoinMutationResult } from "./ledger";

export async function reverseYikeCoinDebit(input: {
  userId: string;
  originalIdempotencyKey: string;
  reversalIdempotencyKey: string;
  reason?: string;
}): Promise<CoinMutationResult> {
  if (!input.userId?.trim() || !input.originalIdempotencyKey?.trim() || !input.reversalIdempotencyKey?.trim()) {
    return { ok: false, error: "Invalid reversal input", code: "invalid_input" };
  }

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Database unavailable", code: "unavailable" };

  const { data, error } = await admin.rpc("yike_coin_reverse_debit", {
    p_user_id: input.userId,
    p_original_idempotency_key: input.originalIdempotencyKey,
    p_reversal_idempotency_key: input.reversalIdempotencyKey,
    p_reason: input.reason ?? "Service delivery failed — coins restored",
  });

  if (error) {
    const msg = error.message ?? "Reversal failed";
    if (msg.includes("idempotency_key_mismatch")) {
      return {
        ok: false,
        error: "Reversal idempotency key reused for a different debit",
        code: "idempotency_mismatch",
      };
    }
    if (msg.includes("debit_not_found")) {
      return { ok: false, error: "Original debit not found", code: "debit_not_found" };
    }
    return { ok: false, error: msg, code: "reversal_failed" };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    ok: true,
    ledgerId: String(row?.ledger_id ?? ""),
    balanceAfter: Number(row?.balance_after ?? 0),
    alreadyApplied: Boolean(row?.already_applied),
  };
}
