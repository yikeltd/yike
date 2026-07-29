import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentOrder } from "@/types/database";

export type InspectionFulfillmentResult =
  | { ok: true; alreadyFulfilled: boolean; inspectionId: string }
  | { ok: false; error: string };

export async function fulfillLiveInspectionOrder(
  admin: SupabaseClient,
  order: PaymentOrder
): Promise<InspectionFulfillmentResult> {
  const metadata = (order.metadata ?? {}) as Record<string, unknown>;
  const listingId = (metadata.listing_id as string | undefined) ?? order.listing_id ?? undefined;

  const { data: existing } = await admin
    .from("inspection_requests")
    .select("id")
    .eq("payment_order_id", order.id)
    .maybeSingle();

  if (existing?.id) {
    return { ok: true, alreadyFulfilled: true, inspectionId: existing.id as string };
  }

  const { data, error } = await admin
    .from("inspection_requests")
    .insert({
      user_id: order.user_id,
      listing_id: listingId || null,
      payment_order_id: order.id,
      status: "confirmed",
      notes: "Confirmed via Yike Payment Platform",
    })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: true, alreadyFulfilled: false, inspectionId: order.id };
  }

  return { ok: true, alreadyFulfilled: false, inspectionId: data.id as string };
}
