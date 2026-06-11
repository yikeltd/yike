import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentOrder } from "@/types/database";
import { createPaidVerificationOrder } from "@/lib/property-verification/orders";
import { isPackageId } from "@/lib/property-verification/packages";
import { logPaymentAudit } from "@/lib/payments/audit";

export type PropertyVerificationFulfillmentResult =
  | { ok: true; alreadyFulfilled: boolean; orderId: string }
  | { ok: false; error: string };

export async function fulfillPropertyVerificationOrder(
  admin: SupabaseClient,
  order: PaymentOrder
): Promise<PropertyVerificationFulfillmentResult> {
  const metadata = order.metadata as Record<string, unknown>;
  const requestId = String(metadata.request_id ?? "");
  const packageType = String(metadata.package_type ?? "");

  if (!requestId || !isPackageId(packageType)) {
    return { ok: false, error: "Missing request or package on payment order" };
  }

  const { data: existing } = await admin
    .from("property_verification_orders")
    .select("id")
    .eq("payment_order_id", order.id)
    .maybeSingle();

  if (existing?.id) {
    return {
      ok: true,
      alreadyFulfilled: true,
      orderId: existing.id as string,
    };
  }

  const result = await createPaidVerificationOrder(admin, {
    userId: order.user_id,
    requestId,
    packageType,
    paymentOrderId: order.id,
    paymentReference: order.reference,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  logPaymentAudit({
    action: "verification_request_created",
    actorId: order.user_id,
    targetId: order.id,
    targetUserId: order.user_id,
    metadata: {
      property_verification_order_id: result.order.id,
      package_type: packageType,
      amount: order.amount,
    },
  });

  return {
    ok: true,
    alreadyFulfilled: false,
    orderId: result.order.id,
  };
}
