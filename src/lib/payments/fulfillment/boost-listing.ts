import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentOrder } from "@/types/database";
import { activateBoostPromotion } from "@/lib/featured-promotions/service";
import { logPaymentAudit } from "@/lib/payments/audit";
import { logListingEvent } from "@/lib/listing-analytics";

export type BoostFulfillmentResult =
  | { ok: true; alreadyFulfilled: boolean; promotionId: string; boostedUntil: string | null }
  | { ok: false; error: string };

export async function fulfillBoostListingOrder(
  admin: SupabaseClient,
  order: PaymentOrder
): Promise<BoostFulfillmentResult> {
  const promotionId = order.entity_id;
  if (!promotionId) {
    return { ok: false, error: "Missing promotion reference on order" };
  }

  const { data: promotion } = await admin
    .from("listing_promotions")
    .select("id, status, listing_id, expires_at, promotion_type")
    .eq("id", promotionId)
    .single();

  if (!promotion) {
    return { ok: false, error: "Promotion not found" };
  }

  if (promotion.promotion_type !== "boost") {
    return { ok: false, error: "Invalid promotion type for boost order" };
  }

  if (promotion.status === "active") {
    return {
      ok: true,
      alreadyFulfilled: true,
      promotionId,
      boostedUntil: promotion.expires_at as string | null,
    };
  }

  await admin
    .from("listing_promotions")
    .update({
      payment_reference: order.reference,
      provider: order.provider,
      updated_at: new Date().toISOString(),
    })
    .eq("id", promotionId);

  const activation = await activateBoostPromotion(admin, promotionId, order.user_id);
  if (!activation.ok) {
    return { ok: false, error: activation.error };
  }

  await logListingEvent(admin, {
    listingId: promotion.listing_id as string,
    eventType: "boost_order",
    userId: order.user_id,
    metadata: { order_reference: order.reference, promotion_id: promotionId },
  });

  logPaymentAudit({
    action: "promotion_activated",
    actorId: order.user_id,
    targetId: order.id,
    targetUserId: order.user_id,
    metadata: {
      promotion_id: promotionId,
      listing_id: promotion.listing_id,
      order_reference: order.reference,
      promotion_type: "boost",
      boosted_until: activation.promotion.expires_at,
    },
  });

  return {
    ok: true,
    alreadyFulfilled: false,
    promotionId,
    boostedUntil: activation.promotion.expires_at,
  };
}
