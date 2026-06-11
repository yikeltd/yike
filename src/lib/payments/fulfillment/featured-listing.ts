import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentOrder } from "@/types/database";
import { activateFeaturedPromotion } from "@/lib/featured-promotions/service";
import { logPaymentAudit } from "@/lib/payments/audit";

export type FeaturedFulfillmentResult =
  | { ok: true; alreadyFulfilled: boolean; promotionId: string; featuredUntil: string | null }
  | { ok: false; error: string };

export async function fulfillFeaturedListingOrder(
  admin: SupabaseClient,
  order: PaymentOrder
): Promise<FeaturedFulfillmentResult> {
  const promotionId = order.entity_id;
  if (!promotionId) {
    return { ok: false, error: "Missing promotion reference on order" };
  }

  const { data: promotion } = await admin
    .from("listing_promotions")
    .select("id, status, listing_id, expires_at")
    .eq("id", promotionId)
    .single();

  if (!promotion) {
    return { ok: false, error: "Promotion not found" };
  }

  if (promotion.status === "active") {
    return {
      ok: true,
      alreadyFulfilled: true,
      promotionId,
      featuredUntil: promotion.expires_at as string | null,
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

  const activation = await activateFeaturedPromotion(admin, promotionId, order.user_id);
  if (!activation.ok) {
    return { ok: false, error: activation.error };
  }

  logPaymentAudit({
    action: "promotion_activated",
    actorId: order.user_id,
    targetId: order.id,
    targetUserId: order.user_id,
    metadata: {
      promotion_id: promotionId,
      listing_id: promotion.listing_id,
      order_reference: order.reference,
      featured_until: activation.promotion.expires_at,
    },
  });

  return {
    ok: true,
    alreadyFulfilled: false,
    promotionId,
    featuredUntil: activation.promotion.expires_at,
  };
}
