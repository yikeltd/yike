import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentOrder } from "@/types/database";
import { getPaymentCallbackUrl } from "@/lib/payments/config";
import { logPaymentAudit } from "@/lib/payments/audit";
import { fulfillBoostListingOrder } from "@/lib/payments/fulfillment/boost-listing";
import { fulfillFeaturedListingOrder } from "@/lib/payments/fulfillment/featured-listing";
import { fulfillPropertyVerificationOrder } from "@/lib/payments/fulfillment/property-verification";
import { fulfillVerificationFeeOrder } from "@/lib/payments/fulfillment/verification-fee";
import { resolvePaymentProvider } from "@/lib/payments/providers";
import { generatePaymentReference } from "@/lib/payments/reference";
import type {
  CreatePaymentOrderInput,
  PaymentOrderStatus,
  PaymentProviderName,
} from "@/lib/payments/types";

export type PaymentFulfillmentResult =
  | {
      ok: true;
      order: PaymentOrder;
      alreadyFulfilled: boolean;
      featuredUntil?: string | null;
      boostedUntil?: string | null;
      listingId?: string;
    }
  | { ok: false; error: string; code?: string };

export async function createPaymentOrder(
  admin: SupabaseClient,
  input: CreatePaymentOrderInput
): Promise<PaymentOrder> {
  const reference = generatePaymentReference("YK");
  const provider = input.provider ?? resolvePaymentProvider().name;

  const { data, error } = await admin
    .from("payment_orders")
    .insert({
      user_id: input.userId,
      order_type: input.orderType,
      reference,
      provider,
      amount: input.amount,
      currency: input.currency ?? "NGN",
      status: "pending",
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create payment order");
  }

  const order = data as PaymentOrder;

  logPaymentAudit({
    action: "payment_created",
    actorId: input.userId,
    targetId: order.id,
    targetUserId: input.userId,
    metadata: {
      reference: order.reference,
      order_type: order.order_type,
      amount: order.amount,
      entity_id: order.entity_id,
    },
  });

  return order;
}

export async function initializePayment(
  admin: SupabaseClient,
  orderId: string,
  email: string
): Promise<{ authorizationUrl: string; reference: string }> {
  const { data: orderRow } = await admin
    .from("payment_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!orderRow) throw new Error("Payment order not found");
  const order = orderRow as PaymentOrder;

  if (order.status !== "pending" && order.status !== "processing") {
    throw new Error("Payment order is not payable");
  }

  const provider = resolvePaymentProvider(order.provider as PaymentProviderName);
  if (!provider.isConfigured()) {
    throw new Error("Payment provider is not configured");
  }

  const init = await provider.initializePayment({
    reference: order.reference,
    amount: Number(order.amount),
    currency: order.currency,
    email,
    callbackUrl: getPaymentCallbackUrl(),
    metadata: {
      ...(order.metadata as Record<string, unknown>),
      order_id: order.id,
      order_type: order.order_type,
      user_id: order.user_id,
      entity_id: order.entity_id,
    },
  });

  if (!init.ok) {
    await markPaymentFailed(admin, order.id, init.error);
    throw new Error(init.error);
  }

  await admin
    .from("payment_orders")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", order.id);

  logPaymentAudit({
    action: "payment_initialized",
    actorId: order.user_id,
    targetId: order.id,
    targetUserId: order.user_id,
    metadata: { reference: order.reference, provider: order.provider },
  });

  return { authorizationUrl: init.authorizationUrl, reference: order.reference };
}

export async function markPaymentSuccessful(
  admin: SupabaseClient,
  orderId: string,
  paidAt: string,
  providerReference?: string | null
): Promise<PaymentOrder | null> {
  const { data } = await admin
    .from("payment_orders")
    .update({
      status: "successful",
      paid_at: paidAt,
      updated_at: new Date().toISOString(),
      metadata: providerReference
        ? undefined
        : undefined,
    })
    .eq("id", orderId)
    .in("status", ["pending", "processing"])
    .select("*")
    .maybeSingle();

  if (!data) {
    const { data: existing } = await admin
      .from("payment_orders")
      .select("*")
      .eq("id", orderId)
      .single();
    return (existing as PaymentOrder | null) ?? null;
  }

  const order = data as PaymentOrder;

  logPaymentAudit({
    action: "payment_success",
    actorId: order.user_id,
    targetId: order.id,
    targetUserId: order.user_id,
    metadata: {
      reference: order.reference,
      provider_reference: providerReference ?? null,
      paid_at: paidAt,
    },
  });

  return order;
}

export async function markPaymentFailed(
  admin: SupabaseClient,
  orderId: string,
  reason: string
): Promise<void> {
  const { data } = await admin
    .from("payment_orders")
    .update({
      status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .in("status", ["pending", "processing"])
    .select("user_id")
    .maybeSingle();

  if (data?.user_id) {
    logPaymentAudit({
      action: "payment_failed",
      actorId: data.user_id as string,
      targetId: orderId,
      metadata: { reason },
    });
  }
}

export async function refundPayment(
  admin: SupabaseClient,
  orderId: string
): Promise<PaymentOrder | null> {
  const { data } = await admin
    .from("payment_orders")
    .update({
      status: "refunded",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "successful")
    .select("*")
    .maybeSingle();

  if (!data) return null;

  const order = data as PaymentOrder;
  logPaymentAudit({
    action: "payment_refunded",
    actorId: order.user_id,
    targetId: order.id,
    targetUserId: order.user_id,
    metadata: { reference: order.reference },
  });

  return order;
}

async function fulfillOrder(
  admin: SupabaseClient,
  order: PaymentOrder
): Promise<PaymentFulfillmentResult> {
  if (order.order_type === "featured_listing") {
    const result = await fulfillFeaturedListingOrder(admin, order);
    if (!result.ok) return { ok: false, error: result.error };

    const metadata = order.metadata as Record<string, unknown>;
    return {
      ok: true,
      order,
      alreadyFulfilled: result.alreadyFulfilled,
      featuredUntil: result.featuredUntil,
      listingId: (metadata.listing_id as string | undefined) ?? undefined,
    };
  }

  if (order.order_type === "boost_listing") {
    const result = await fulfillBoostListingOrder(admin, order);
    if (!result.ok) return { ok: false, error: result.error };

    const metadata = order.metadata as Record<string, unknown>;
    return {
      ok: true,
      order,
      alreadyFulfilled: result.alreadyFulfilled,
      boostedUntil: result.boostedUntil,
      listingId: (metadata.listing_id as string | undefined) ?? undefined,
    };
  }

  if (order.order_type === "property_verification") {
    const result = await fulfillPropertyVerificationOrder(admin, order);
    if (!result.ok) return { ok: false, error: result.error };

    return {
      ok: true,
      order,
      alreadyFulfilled: result.alreadyFulfilled,
    };
  }

  if (order.order_type === "verification_fee") {
    const result = await fulfillVerificationFeeOrder(admin, order);
    if (!result.ok) return { ok: false, error: result.error };

    return {
      ok: true,
      order,
      alreadyFulfilled: result.alreadyFulfilled,
    };
  }

  return { ok: false, error: "Order type not supported yet", code: "unsupported" };
}

export async function verifyPayment(
  admin: SupabaseClient,
  reference: string
): Promise<PaymentFulfillmentResult> {
  const { data: orderRow } = await admin
    .from("payment_orders")
    .select("*")
    .eq("reference", reference)
    .single();

  if (!orderRow) {
    return { ok: false, error: "Payment not found", code: "not_found" };
  }

  const order = orderRow as PaymentOrder;

  if (order.status === "successful") {
    const fulfillment = await fulfillOrder(admin, order);
    return fulfillment.ok
      ? { ...fulfillment, alreadyFulfilled: true }
      : fulfillment;
  }

  if (order.status === "refunded" || order.status === "failed" || order.status === "cancelled") {
    return { ok: false, error: "Payment was not successful", code: order.status };
  }

  const provider = resolvePaymentProvider(order.provider as PaymentProviderName);
  const verified = await provider.verifyPayment(reference);

  if (!verified.ok) {
    return { ok: false, error: verified.error, code: "verify_failed" };
  }

  if (verified.status === "pending") {
    return { ok: false, error: "Payment is still processing", code: "pending" };
  }

  if (verified.status === "failed") {
    await markPaymentFailed(admin, order.id, "Provider reported failed payment");
    return { ok: false, error: "Payment failed", code: "failed" };
  }

  const paidAmount = verified.amount;
  if (Math.abs(paidAmount - Number(order.amount)) > 0.01) {
    await markPaymentFailed(admin, order.id, "Amount mismatch");
    return { ok: false, error: "Payment amount mismatch", code: "amount_mismatch" };
  }

  const paidAt = verified.paidAt ?? new Date().toISOString();
  const claimed = await markPaymentSuccessful(
    admin,
    order.id,
    paidAt,
    verified.providerReference
  );

  if (!claimed || claimed.status !== "successful") {
    const { data: current } = await admin
      .from("payment_orders")
      .select("*")
      .eq("id", order.id)
      .single();
    if (current?.status === "successful") {
      return fulfillOrder(admin, current as PaymentOrder);
    }
    return { ok: false, error: "Could not confirm payment", code: "claim_failed" };
  }

  return fulfillOrder(admin, claimed);
}

export async function loadPaymentOrderByReference(
  admin: SupabaseClient,
  reference: string
): Promise<PaymentOrder | null> {
  const { data } = await admin
    .from("payment_orders")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();
  return (data as PaymentOrder | null) ?? null;
}

export function isTerminalPaymentStatus(status: PaymentOrderStatus): boolean {
  return status === "successful" || status === "failed" || status === "cancelled" || status === "refunded";
}
