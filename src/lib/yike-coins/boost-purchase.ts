import type { SupabaseClient } from "@supabase/supabase-js";
import {
  activateBoostPromotion,
  createBoostPromotion,
} from "@/lib/featured-promotions/service";
import type { BoostPlanId } from "@/lib/featured-promotions/constants";
import { isBoostPlanId } from "@/lib/featured-promotions/constants";
import { isYikeCoinsEnabled } from "./flags";
import { purchaseWithYikeCoins } from "./purchase-engine";
import { isListingBoostCoinPurchaseEnabled } from "./pricing";
import { ngnToCoins } from "./constants";

export type BoostCoinPurchaseResult =
  | {
      ok: true;
      promotionId: string;
      priceCoins: number;
      balanceAfter: number;
      alreadyApplied: boolean;
    }
  | { ok: false; error: string; code: string };

/**
 * Pay for listing boost with Yike Coins (1 coin = ₦1 nominal of approved boost price).
 * Paystack boost checkout remains available for legacy/pending orders.
 */
export async function purchaseListingBoostWithYikeCoins(
  admin: SupabaseClient,
  input: {
    userId: string;
    listingId: string;
    plan: string;
    idempotencyKey: string;
  }
): Promise<BoostCoinPurchaseResult> {
  if (!isYikeCoinsEnabled()) {
    return { ok: false, error: "Yike Coins are not available", code: "disabled" };
  }

  if (!isBoostPlanId(input.plan)) {
    return { ok: false, error: "Invalid boost plan", code: "invalid_plan" };
  }

  const coinGate = await isListingBoostCoinPurchaseEnabled(admin);
  if (!coinGate.ok) {
    return {
      ok: false,
      error: coinGate.error,
      code: coinGate.code === "inactive" ? "coin_boost_disabled" : coinGate.code,
    };
  }

  const plan = input.plan as BoostPlanId;
  const created = await createBoostPromotion(admin, {
    listingId: input.listingId,
    userId: input.userId,
    plan,
  });

  if (!created.ok) {
    return { ok: false, error: created.error, code: created.code ?? "create_failed" };
  }

  const amountNgn = Number(created.promotion.amount);
  const priceCoins = ngnToCoins(amountNgn);
  if (priceCoins <= 0) {
    return { ok: false, error: "Boost pricing unavailable", code: "not_configured" };
  }

  const purchase = await purchaseWithYikeCoins(admin, {
    userId: input.userId,
    serviceCode: "listing_boost",
    idempotencyKey: input.idempotencyKey,
    reference: created.promotion.promotion_reference ?? `BOOST-${created.promotion.id.slice(0, 8)}`,
    priceCoins,
    entityType: "listing_promotion",
    entityId: created.promotion.id,
    metadata: { listing_id: input.listingId, plan },
    onDebited: async ({ admin: a }) => {
      const activation = await activateBoostPromotion(a, created.promotion.id, input.userId);
      if (!activation.ok) {
        return { ok: false, error: activation.error };
      }
      return { ok: true };
    },
  });

  if (!purchase.ok) {
    await admin
      .from("listing_promotions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", created.promotion.id)
      .in("status", ["pending", "paid"]);
    return { ok: false, error: purchase.error, code: purchase.code };
  }

  return {
    ok: true,
    promotionId: created.promotion.id,
    priceCoins: purchase.priceCoins,
    balanceAfter: purchase.balanceAfter,
    alreadyApplied: purchase.alreadyApplied,
  };
}
