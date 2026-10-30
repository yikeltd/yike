import type { SupabaseClient } from "@supabase/supabase-js";
import { debitYikeCoins } from "./ledger";
import { resolveActiveServicePrice, type PlatformServiceCode } from "./pricing";
import { reverseYikeCoinDebit } from "./reversal";
import {
  markEntitlementFulfilled,
  markEntitlementReversed,
  upsertPurchaseEntitlement,
} from "./entitlements";

export type PurchaseWithCoinsInput = {
  userId: string;
  serviceCode: PlatformServiceCode;
  idempotencyKey: string;
  reference: string;
  /** When set, overrides catalog price (must still be server-computed). */
  priceCoins?: number;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  onDebited?: (ctx: {
    admin: SupabaseClient;
    ledgerId: string;
    priceCoins: number;
  }) => Promise<{ ok: boolean; error?: string }>;
};

export type PurchaseWithCoinsResult =
  | { ok: true; ledgerId: string; balanceAfter: number; priceCoins: number; alreadyApplied: boolean }
  | { ok: false; error: string; code: string };

/**
 * Unified server-side purchase: resolve price → debit atomically → deliver → reverse on failure.
 */
export async function purchaseWithYikeCoins(
  admin: SupabaseClient,
  input: PurchaseWithCoinsInput
): Promise<PurchaseWithCoinsResult> {
  let priceCoins = input.priceCoins;
  if (priceCoins == null) {
    const resolved = await resolveActiveServicePrice(admin, input.serviceCode);
    if (!resolved.ok) {
      return { ok: false, error: resolved.error, code: resolved.code };
    }
    priceCoins = resolved.priceCoins;
  }

  if (!Number.isInteger(priceCoins) || priceCoins <= 0) {
    return { ok: false, error: "Invalid price", code: "invalid_price" };
  }

  const debit = await debitYikeCoins({
    userId: input.userId,
    amountCoins: priceCoins,
    reference: input.reference,
    idempotencyKey: input.idempotencyKey,
    serviceCode: input.serviceCode,
    reason: `Purchase: ${input.serviceCode}`,
    metadata: input.metadata,
  });

  if (!debit.ok) {
    return {
      ok: false,
      error: debit.error,
      code: debit.code ?? "debit_failed",
    };
  }

  if (!debit.alreadyApplied) {
    await upsertPurchaseEntitlement(admin, {
      userId: input.userId,
      serviceCode: input.serviceCode,
      idempotencyKey: input.idempotencyKey,
      debitLedgerId: debit.ledgerId,
      entityType: input.entityType,
      entityId: input.entityId,
      status: "debited",
    });
  }

  if (input.onDebited) {
    const delivery = await input.onDebited({
      admin,
      ledgerId: debit.ledgerId,
      priceCoins,
    });

    if (!delivery.ok) {
      const reversalKey = `${input.idempotencyKey}:reversal`;
      const reversal = await reverseYikeCoinDebit({
        userId: input.userId,
        originalIdempotencyKey: input.idempotencyKey,
        reversalIdempotencyKey: reversalKey,
        reason: delivery.error ?? "Service delivery failed",
      });

      if (reversal.ok) {
        await markEntitlementReversed(admin, input.idempotencyKey, reversal.ledgerId);
      } else {
        await admin
          .from("yike_coin_purchase_entitlements")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("idempotency_key", input.idempotencyKey);
      }

      return {
        ok: false,
        error: delivery.error ?? "Service delivery failed — coins restored when possible",
        code: reversal.ok ? "delivery_failed_reversed" : "delivery_failed_reversal_pending",
      };
    }

    await markEntitlementFulfilled(admin, input.idempotencyKey);
  }

  return {
    ok: true,
    ledgerId: debit.ledgerId,
    balanceAfter: debit.balanceAfter,
    priceCoins,
    alreadyApplied: debit.alreadyApplied,
  };
}
