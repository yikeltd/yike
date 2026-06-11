import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentOrder } from "@/types/database";
import { activateAdvertisementFromPayment } from "@/lib/advertisements/service";

export type AdvertisementFulfillmentResult =
  | { ok: true; alreadyFulfilled: boolean; advertisementId: string }
  | { ok: false; error: string };

export async function fulfillAdvertisementOrder(
  admin: SupabaseClient,
  order: PaymentOrder
): Promise<AdvertisementFulfillmentResult> {
  const metadata = order.metadata as Record<string, unknown>;
  const advertisementId = String(metadata.advertisement_id ?? order.entity_id ?? "");

  if (!advertisementId) {
    return { ok: false, error: "Missing advertisement reference on order" };
  }

  const { data: existing } = await admin
    .from("advertisements")
    .select("id, status")
    .eq("id", advertisementId)
    .single();

  if (!existing) {
    return { ok: false, error: "Advertisement not found" };
  }

  if (existing.status === "active") {
    return { ok: true, alreadyFulfilled: true, advertisementId };
  }

  const result = await activateAdvertisementFromPayment(admin, {
    advertisementId,
    paymentOrderId: order.id,
    paymentReference: order.reference,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true, alreadyFulfilled: false, advertisementId };
}
