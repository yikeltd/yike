import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentOrder } from "@/types/database";
import { activateSubscriptionFromPayment } from "@/lib/subscriptions/service";
import { isSubscriptionPlanCode } from "@/lib/subscriptions/constants";

export type SubscriptionFulfillmentResult =
  | { ok: true; alreadyFulfilled: boolean; subscriptionId: string }
  | { ok: false; error: string };

export async function fulfillSubscriptionOrder(
  admin: SupabaseClient,
  order: PaymentOrder
): Promise<SubscriptionFulfillmentResult> {
  const metadata = order.metadata as Record<string, unknown>;
  const planCode = String(metadata.plan_code ?? "");
  const durationDays = Number(metadata.duration_days ?? 30);

  if (!isSubscriptionPlanCode(planCode)) {
    return { ok: false, error: "Invalid plan on order" };
  }

  const { data: existing } = await admin
    .from("user_subscriptions")
    .select("id")
    .eq("payment_order_id", order.id)
    .eq("status", "active")
    .maybeSingle();

  if (existing?.id) {
    return {
      ok: true,
      alreadyFulfilled: true,
      subscriptionId: existing.id as string,
    };
  }

  const result = await activateSubscriptionFromPayment(admin, {
    userId: order.user_id,
    planCode,
    paymentOrderId: order.id,
    paymentReference: order.reference,
    durationDays: Number.isFinite(durationDays) ? durationDays : 30,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return {
    ok: true,
    alreadyFulfilled: false,
    subscriptionId: result.subscription.id,
  };
}
