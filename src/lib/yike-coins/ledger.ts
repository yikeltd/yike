import { createAdminClient } from "@/lib/supabase/admin";
import { isYikeCoinsEnabled } from "./flags";

export type CoinLedgerDirection = "credit" | "debit";

export type CoinCreditInput = {
  userId: string;
  amountCoins: number;
  reference: string;
  idempotencyKey: string;
  serviceCode?: string | null;
  paymentOrderId?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
};

export type CoinDebitInput = {
  userId: string;
  amountCoins: number;
  reference: string;
  idempotencyKey: string;
  serviceCode?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
};

export type CoinMutationResult =
  | { ok: true; ledgerId: string; balanceAfter: number; alreadyApplied: boolean }
  | { ok: false; error: string; code?: string };

function assertIntegerCoins(amount: number): boolean {
  return Number.isInteger(amount) && amount > 0;
}

function assertCoinMutationInput(userId: string, idempotencyKey: string, reference: string): string | null {
  if (!userId?.trim()) return "Invalid user";
  if (!idempotencyKey?.trim()) return "Invalid idempotency key";
  if (!reference?.trim()) return "Invalid reference";
  return null;
}

function mapLedgerRpcError(message: string | undefined): { error: string; code: string } {
  const msg = message ?? "Ledger mutation failed";
  if (msg.includes("idempotency_key_mismatch")) {
    return { error: "Idempotency key reused with different transaction", code: "idempotency_mismatch" };
  }
  if (msg.includes("insufficient_balance")) {
    return { error: "Insufficient Yike Coins", code: "insufficient_balance" };
  }
  if (msg.includes("invalid_")) {
    return { error: "Invalid coin transaction input", code: "invalid_input" };
  }
  return { error: msg, code: "ledger_failed" };
}

export async function getYikeCoinBalance(userId: string): Promise<number> {
  const admin = createAdminClient();
  if (!admin) return 0;

  await admin.rpc("yike_ensure_coin_account", { p_user_id: userId });

  const { data } = await admin
    .from("yike_coin_accounts")
    .select("balance_coins")
    .eq("user_id", userId)
    .maybeSingle();

  return Number(data?.balance_coins ?? 0);
}

export async function creditYikeCoins(input: CoinCreditInput): Promise<CoinMutationResult> {
  if (!isYikeCoinsEnabled()) {
    return { ok: false, error: "Yike Coins are not available", code: "disabled" };
  }
  if (!assertIntegerCoins(input.amountCoins)) {
    return { ok: false, error: "Invalid coin amount", code: "invalid_amount" };
  }
  const inputError = assertCoinMutationInput(input.userId, input.idempotencyKey, input.reference);
  if (inputError) {
    return { ok: false, error: inputError, code: "invalid_input" };
  }

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Database unavailable", code: "unavailable" };

  const { data, error } = await admin.rpc("yike_coin_credit", {
    p_user_id: input.userId,
    p_amount_coins: input.amountCoins,
    p_reference: input.reference,
    p_idempotency_key: input.idempotencyKey,
    p_service_code: input.serviceCode ?? null,
    p_payment_order_id: input.paymentOrderId ?? null,
    p_reason: input.reason ?? null,
    p_metadata: input.metadata ?? {},
  });

  if (error) {
    const mapped = mapLedgerRpcError(error.message);
    return { ok: false, error: mapped.error, code: mapped.code };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    ok: true,
    ledgerId: String(row?.ledger_id ?? ""),
    balanceAfter: Number(row?.balance_after ?? 0),
    alreadyApplied: Boolean(row?.already_applied),
  };
}

export async function debitYikeCoins(input: CoinDebitInput): Promise<CoinMutationResult> {
  if (!isYikeCoinsEnabled()) {
    return { ok: false, error: "Yike Coins are not available", code: "disabled" };
  }
  if (!assertIntegerCoins(input.amountCoins)) {
    return { ok: false, error: "Invalid coin amount", code: "invalid_amount" };
  }
  const inputError = assertCoinMutationInput(input.userId, input.idempotencyKey, input.reference);
  if (inputError) {
    return { ok: false, error: inputError, code: "invalid_input" };
  }

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Database unavailable", code: "unavailable" };

  const { data, error } = await admin.rpc("yike_coin_debit", {
    p_user_id: input.userId,
    p_amount_coins: input.amountCoins,
    p_reference: input.reference,
    p_idempotency_key: input.idempotencyKey,
    p_service_code: input.serviceCode ?? null,
    p_reason: input.reason ?? null,
    p_metadata: input.metadata ?? {},
  });

  if (error) {
    const mapped = mapLedgerRpcError(error.message);
    return { ok: false, error: mapped.error, code: mapped.code };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    ok: true,
    ledgerId: String(row?.ledger_id ?? ""),
    balanceAfter: Number(row?.balance_after ?? 0),
    alreadyApplied: Boolean(row?.already_applied),
  };
}
