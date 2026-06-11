import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentOrder } from "@/types/database";
import { logPaymentAudit } from "@/lib/payments/audit";
import {
  createBusinessVerificationFromPayment,
} from "@/lib/seller-verification/service";
import type { SellerVerificationDocuments } from "@/lib/seller-verification/levels";

export type VerificationFeeFulfillmentResult =
  | { ok: true; alreadyFulfilled: boolean; verificationId: string }
  | { ok: false; error: string };

export async function fulfillVerificationFeeOrder(
  admin: SupabaseClient,
  order: PaymentOrder
): Promise<VerificationFeeFulfillmentResult> {
  const metadata = order.metadata as Record<string, unknown>;
  const documents = metadata.documents as SellerVerificationDocuments | undefined;

  if (!documents) {
    return { ok: false, error: "Missing verification documents on order" };
  }

  const { data: existing } = await admin
    .from("seller_verifications")
    .select("id")
    .eq("payment_order_id", order.id)
    .maybeSingle();

  if (existing?.id) {
    return {
      ok: true,
      alreadyFulfilled: true,
      verificationId: existing.id as string,
    };
  }

  const result = await createBusinessVerificationFromPayment(admin, {
    userId: order.user_id,
    paymentOrderId: order.id,
    documents,
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
      verification_id: result.verification.id,
      reference: order.reference,
    },
  });

  return {
    ok: true,
    alreadyFulfilled: false,
    verificationId: result.verification.id,
  };
}
