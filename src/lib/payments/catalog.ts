import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isBoostPlanId,
  isFeaturedDurationDays,
  type BoostPlanId,
  type FeaturedDurationDays,
} from "@/lib/featured-promotions/constants";
import {
  createBoostPromotion,
  createFeaturedPromotion,
} from "@/lib/featured-promotions/service";
import { getPaymentCurrency } from "@/lib/payments/config";
import type { PaymentPurpose } from "@/lib/payments/types";
import { isPaymentPurpose } from "@/lib/payments/types";
import { ngnToCoins } from "@/lib/yike-coins/constants";
import { getYikeCoinTopupPackages } from "@/lib/yike-coins/topup-packages";
import { isYikeCoinsEnabled } from "@/lib/yike-coins/flags";

export type InitializeCatalogInput = {
  purpose: string;
  listingId?: string | null;
  durationDays?: number | null;
  boostPlan?: string | null;
  planCode?: string | null;
  packageId?: string | null;
  /** Ignored if present — amounts are always server-priced */
  amount?: unknown;
};

export type ResolvedPaymentProduct =
  | {
      ok: true;
      purpose: PaymentPurpose;
      amount: number;
      currency: string;
      entityId: string | null;
      listingId: string | null;
      metadata: Record<string, unknown>;
    }
  | { ok: false; error: string; code: string };

/**
 * Resolve a payable product server-side.
 * Client-supplied amounts/status are never trusted.
 */
export async function resolvePayableProduct(
  admin: SupabaseClient,
  userId: string,
  input: InitializeCatalogInput
): Promise<ResolvedPaymentProduct> {
  if (!isPaymentPurpose(input.purpose)) {
    return { ok: false, error: "Unknown payment purpose", code: "invalid_purpose" };
  }

  const purpose = input.purpose;
  const currency = getPaymentCurrency();

  if (purpose === "featured_listing") {
    const listingId = input.listingId?.trim();
    const durationDays = Number(input.durationDays);
    if (!listingId) {
      return { ok: false, error: "Listing required", code: "listing_required" };
    }
    if (!isFeaturedDurationDays(durationDays)) {
      return { ok: false, error: "Choose 7 or 30 days", code: "invalid_duration" };
    }

    const created = await createFeaturedPromotion(admin, {
      listingId,
      userId,
      durationDays: durationDays as FeaturedDurationDays,
    });
    if (!created.ok) {
      return { ok: false, error: created.error, code: created.code ?? "create_failed" };
    }

    const { getSubscriptionDiscountRate, applyDiscount } = await import(
      "@/lib/subscriptions/discounts"
    );
    const discountRate = await getSubscriptionDiscountRate(admin, userId, "featured");
    const chargedAmount = applyDiscount(Number(created.promotion.amount), discountRate);

    return {
      ok: true,
      purpose,
      amount: chargedAmount,
      currency: created.promotion.currency || currency,
      entityId: created.promotion.id,
      listingId,
      metadata: {
        listing_id: listingId,
        promotion_id: created.promotion.id,
        promotion_type: "featured",
        duration_days: created.promotion.duration_days,
        user_id: userId,
      },
    };
  }

  if (
    purpose === "boost_listing" ||
    purpose === "vehicle_boost" ||
    purpose === "property_boost"
  ) {
    const listingId = input.listingId?.trim();
    const plan = input.boostPlan?.trim() ?? "";
    if (!listingId) {
      return { ok: false, error: "Listing required", code: "listing_required" };
    }
    if (!isBoostPlanId(plan)) {
      return { ok: false, error: "Choose a boost duration", code: "invalid_duration" };
    }

    const created = await createBoostPromotion(admin, {
      listingId,
      userId,
      plan: plan as BoostPlanId,
    });
    if (!created.ok) {
      return { ok: false, error: created.error, code: created.code ?? "create_failed" };
    }

    const { getSubscriptionDiscountRate, applyDiscount } = await import(
      "@/lib/subscriptions/discounts"
    );
    const discountRate = await getSubscriptionDiscountRate(admin, userId, "boost");
    const chargedAmount = applyDiscount(Number(created.promotion.amount), discountRate);

    return {
      ok: true,
      purpose,
      amount: chargedAmount,
      currency: created.promotion.currency || currency,
      entityId: created.promotion.id,
      listingId,
      metadata: {
        listing_id: listingId,
        promotion_id: created.promotion.id,
        promotion_type: "boost",
        duration_days: created.promotion.duration_days,
        duration_hours: created.promotion.duration_hours,
        user_id: userId,
      },
    };
  }

  if (purpose === "wallet_topup") {
    if (!isYikeCoinsEnabled()) {
      return { ok: false, error: "Yike Coins are not available", code: "disabled" };
    }
    const packNgn = Number(input.packageId ?? input.durationDays);
    const allowed = getYikeCoinTopupPackages().some((p) => p.amountNgn === packNgn);
    if (!Number.isInteger(packNgn) || packNgn <= 0 || !allowed) {
      return { ok: false, error: "Choose a top-up amount", code: "invalid_pack" };
    }
    const coins = ngnToCoins(packNgn);
    return {
      ok: true,
      purpose,
      amount: packNgn,
      currency,
      entityId: null,
      listingId: null,
      metadata: {
        user_id: userId,
        yike_coins: coins,
        nominal_ngn_per_coin: 1,
        product: "Yike Coins",
      },
    };
  }

  // Subscription / verification / ads keep using dedicated checkout routes for now.
  return {
    ok: false,
    error:
      "Use the product checkout for this purpose, or pass via a dedicated server route",
    code: "use_dedicated_checkout",
  };
}
