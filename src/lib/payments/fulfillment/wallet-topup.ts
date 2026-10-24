import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentOrder } from "@/types/database";
import { ngnToCoins } from "@/lib/yike-coins/constants";
import { creditYikeCoins } from "@/lib/yike-coins/ledger";
import { isYikeCoinsEnabled } from "@/lib/yike-coins/flags";
import { logPaymentAudit } from "@/lib/payments/audit";

export type WalletTopupFulfillmentResult =
  | { ok: true; alreadyFulfilled: boolean; coinsCredited: number; balanceAfter: number }
  | { ok: false; error: string };

export async function fulfillWalletTopupOrder(
  admin: SupabaseClient,
  order: PaymentOrder
): Promise<WalletTopupFulfillmentResult> {
  if (!isYikeCoinsEnabled()) {
    return { ok: false, error: "Yike Coins top-up is not enabled" };
  }

  const metadata = (order.metadata ?? {}) as Record<string, unknown>;
  if (metadata.yike_coins_fulfilled === true) {
    const balanceAfter = Number(metadata.yike_coins_balance_after ?? 0);
    const coins = Number(metadata.yike_coins_credited ?? ngnToCoins(Number(order.amount)));
    return { ok: true, alreadyFulfilled: true, coinsCredited: coins, balanceAfter };
  }

  const paidNgn = Number(order.amount);
  const coins = ngnToCoins(paidNgn);
  if (coins <= 0) {
    return { ok: false, error: "Invalid top-up amount" };
  }

  const idempotencyKey = `wallet_topup:${order.reference}`;
  const credit = await creditYikeCoins({
    userId: order.user_id,
    amountCoins: coins,
    reference: order.reference,
    idempotencyKey,
    serviceCode: "wallet_topup",
    paymentOrderId: order.id,
    reason: "Paystack Yike Coins top-up",
    metadata: {
      order_type: order.order_type,
      currency: order.currency,
      paid_ngn: paidNgn,
    },
  });

  if (!credit.ok) {
    return { ok: false, error: credit.error };
  }

  await admin
    .from("payment_orders")
    .update({
      metadata: {
        ...metadata,
        yike_coins_fulfilled: true,
        yike_coins_credited: coins,
        yike_coins_balance_after: credit.balanceAfter,
        yike_coins_ledger_id: credit.ledgerId,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  logPaymentAudit({
    action: "wallet_topup_credited",
    actorId: order.user_id,
    targetId: order.id,
    targetUserId: order.user_id,
    metadata: {
      reference: order.reference,
      coins,
      balance_after: credit.balanceAfter,
      ledger_id: credit.ledgerId,
    },
  });

  return {
    ok: true,
    alreadyFulfilled: credit.alreadyApplied,
    coinsCredited: coins,
    balanceAfter: credit.balanceAfter,
  };
}
