import type { SupabaseClient } from "@supabase/supabase-js";
import { toOptionalUuid } from "@/lib/uuid";
import type { PaymentOrder } from "@/types/database";
import {
  getPaymentCallbackUrl,
  getPaymentCurrency,
  getDefaultPaymentProvider,
} from "@/lib/payments/config";
import { logPaymentAudit } from "@/lib/payments/audit";
import { fulfillBoostListingOrder } from "@/lib/payments/fulfillment/boost-listing";
import { fulfillFeaturedListingOrder } from "@/lib/payments/fulfillment/featured-listing";
import { fulfillPropertyVerificationOrder } from "@/lib/payments/fulfillment/property-verification";
import { fulfillVerificationFeeOrder } from "@/lib/payments/fulfillment/verification-fee";
import { fulfillAdvertisementOrder } from "@/lib/payments/fulfillment/advertisement";
import { resolvePaymentProvider } from "@/lib/payments/providers";
import { generatePaymentReference } from "@/lib/payments/reference";
import { notifyPaymentSuccessful } from "@/lib/payments/notify";
import type {
  CreatePaymentOrderInput,
  PaymentOrderStatus,
  PaymentProviderName,
  PaymentPurpose,
  PaymentStatusSnapshot,
  VerifyPaymentResult,
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

function asPaymentOrder(row: Record<string, unknown>): PaymentOrder {
  return row as unknown as PaymentOrder;
}

export async function createPaymentOrder(
  admin: SupabaseClient,
  input: CreatePaymentOrderInput
): Promise<PaymentOrder> {
  const userIdClean = toOptionalUuid(input.userId);
  if (!userIdClean) {
    throw new Error("Invalid user ID provided for payment order");
  }

  const reference = generatePaymentReference("YK");
  const provider = input.provider ?? getDefaultPaymentProvider();
  const currency = input.currency ?? getPaymentCurrency();
  const rawListingId =
    input.listingId ??
    (typeof input.metadata?.listing_id === "string" ? input.metadata.listing_id : null);
  const listingId = toOptionalUuid(rawListingId);
  const entityId = toOptionalUuid(input.entityId);

  // Prefer extended columns when migration is applied; fall back gracefully.
  const baseRow = {
    user_id: userIdClean,
    order_type: input.orderType,
    reference,
    provider,
    amount: input.amount,
    currency,
    status: "pending" as const,
    entity_id: entityId,
    metadata: input.metadata ?? {},
  };

  const extendedRow = {
    ...baseRow,
    listing_id: listingId,
    gateway: provider,
    gateway_response: {},
  };

  let data: Record<string, unknown> | null = null;
  let error: { message?: string; code?: string } | null = null;

  {
    const inserted = await admin
      .from("payment_orders")
      .insert(extendedRow)
      .select("*")
      .single();
    data = inserted.data as Record<string, unknown> | null;
    error = inserted.error;

    // Migration not applied yet — retry without new columns
    if (error && /listing_id|gateway|gateway_response|column/i.test(error.message ?? "")) {
      const fallback = await admin
        .from("payment_orders")
        .insert(baseRow)
        .select("*")
        .single();
      data = fallback.data as Record<string, unknown> | null;
      error = fallback.error;
    }
  }

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create payment order");
  }

  const order = asPaymentOrder(data);

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
      listing_id: listingId,
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
  const order = asPaymentOrder(orderRow as Record<string, unknown>);

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
      purpose: order.order_type,
      user_id: order.user_id,
      entity_id: order.entity_id,
    },
  });

  if (!init.ok) {
    await markPaymentFailed(admin, order.id, init.error);
    throw new Error(init.error);
  }

  const updatePayload: Record<string, unknown> = {
    status: "processing",
    updated_at: new Date().toISOString(),
  };
  if (init.providerReference) {
    updatePayload.paystack_reference = init.providerReference;
  }

  const updated = await admin
    .from("payment_orders")
    .update(updatePayload)
    .eq("id", order.id);

  if (updated.error && /paystack_reference|column/i.test(updated.error.message ?? "")) {
    await admin
      .from("payment_orders")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", order.id);
  }

  logPaymentAudit({
    action: "payment_initialized",
    actorId: order.user_id,
    targetId: order.id,
    targetUserId: order.user_id,
    metadata: { reference: order.reference, provider: order.provider },
  });

  return { authorizationUrl: init.authorizationUrl, reference: order.reference };
}

type SuccessExtras = {
  providerReference?: string | null;
  channel?: string | null;
  fees?: number | null;
  gatewayResponse?: Record<string, unknown> | null;
};

export async function markPaymentSuccessful(
  admin: SupabaseClient,
  orderId: string,
  paidAt: string,
  extras: SuccessExtras = {}
): Promise<PaymentOrder | null> {
  const updatePayload: Record<string, unknown> = {
    status: "successful",
    paid_at: paidAt,
    updated_at: new Date().toISOString(),
  };

  if (extras.providerReference) {
    updatePayload.paystack_reference = extras.providerReference;
  }
  if (extras.channel != null) {
    updatePayload.channel = extras.channel;
  }
  if (extras.fees != null) {
    updatePayload.fees = extras.fees;
  }
  if (extras.gatewayResponse) {
    updatePayload.gateway_response = extras.gatewayResponse;
  }

  let { data, error } = await admin
    .from("payment_orders")
    .update(updatePayload)
    .eq("id", orderId)
    .in("status", ["pending", "processing"])
    .select("*")
    .maybeSingle();

  if (error && /paystack_reference|channel|fees|gateway_response|column/i.test(error.message ?? "")) {
    const fallback = await admin
      .from("payment_orders")
      .update({
        status: "successful",
        paid_at: paidAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .in("status", ["pending", "processing"])
      .select("*")
      .maybeSingle();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    const { data: existing } = await admin
      .from("payment_orders")
      .select("*")
      .eq("id", orderId)
      .single();
    return existing ? asPaymentOrder(existing as Record<string, unknown>) : null;
  }

  const order = asPaymentOrder(data as Record<string, unknown>);

  logPaymentAudit({
    action: "payment_success",
    actorId: order.user_id,
    targetId: order.id,
    targetUserId: order.user_id,
    metadata: {
      reference: order.reference,
      provider_reference: extras.providerReference ?? null,
      paid_at: paidAt,
      channel: extras.channel ?? null,
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

export async function markPaymentCancelled(
  admin: SupabaseClient,
  orderId: string,
  reason = "cancelled"
): Promise<void> {
  const { data } = await admin
    .from("payment_orders")
    .update({
      status: "cancelled",
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
      metadata: { reason, status: "cancelled" },
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

  const order = asPaymentOrder(data as Record<string, unknown>);
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

  if (
    order.order_type === "boost_listing" ||
    order.order_type === "vehicle_boost" ||
    order.order_type === "property_boost"
  ) {
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

  if (order.order_type === "advertisement") {
    const result = await fulfillAdvertisementOrder(admin, order);
    if (!result.ok) return { ok: false, error: result.error };

    return {
      ok: true,
      order,
      alreadyFulfilled: result.alreadyFulfilled,
    };
  }

  if (order.order_type === "subscription" || order.order_type === "premium_seller") {
    const { fulfillSubscriptionOrder } = await import(
      "@/lib/payments/fulfillment/subscription"
    );
    const result = await fulfillSubscriptionOrder(admin, order);
    if (!result.ok) return { ok: false, error: result.error };

    return {
      ok: true,
      order,
      alreadyFulfilled: result.alreadyFulfilled,
    };
  }

  if (order.order_type === "lead_insights") {
    const { fulfillLeadInsightsOrder } = await import(
      "@/lib/payments/fulfillment/lead-insights"
    );
    const result = await fulfillLeadInsightsOrder(admin, order);
    if (!result.ok) return { ok: false, error: result.error };

    return {
      ok: true,
      order,
      alreadyFulfilled: result.alreadyFulfilled,
    };
  }

  if (
    order.order_type === "escrow_hold" ||
    order.order_type === "wallet_topup" ||
    order.order_type === "listing_fee"
  ) {
    // Reserved purposes — mark paid without product activation until launched.
    return { ok: true, order, alreadyFulfilled: true };
  }

  return { ok: false, error: "Order type not supported yet", code: "unsupported" };
}

function fulfillmentMarker(order: PaymentOrder): boolean {
  const metadata = (order.metadata ?? {}) as Record<string, unknown>;
  return metadata.fulfilled === true || order.status === "successful";
}

/**
 * Status poll only — does NOT call Paystack and does NOT activate products.
 * Callback / client polling must use this path exclusively.
 */
export async function getPaymentStatus(
  admin: SupabaseClient,
  reference: string
): Promise<
  | { ok: true; payment: PaymentStatusSnapshot }
  | { ok: false; error: string; code: "not_found" }
> {
  const { data } = await admin
    .from("payment_orders")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();

  if (!data) {
    return { ok: false, error: "Payment not found", code: "not_found" };
  }

  const order = asPaymentOrder(data as Record<string, unknown>);
  const metadata = (order.metadata ?? {}) as Record<string, unknown>;
  const listingId =
    (order as PaymentOrder & { listing_id?: string | null }).listing_id ??
    (typeof metadata.listing_id === "string" ? metadata.listing_id : null);

  return {
    ok: true,
    payment: {
      id: order.id,
      reference: order.reference,
      purpose: order.order_type as PaymentPurpose,
      status: order.status,
      amount: Number(order.amount),
      currency: order.currency,
      listingId,
      entityId: order.entity_id,
      paidAt: order.paid_at,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      fulfilled: order.status === "successful" && fulfillmentMarker(order),
      metadata,
    },
  };
}

/**
 * Source-of-truth reconciliation:
 * 1) Load local pending/processing order
 * 2) Verify with gateway API (never trust webhook body amounts alone)
 * 3) Idempotently mark successful
 * 4) Activate product
 *
 * Call ONLY from signed webhooks or trusted admin reconcile — never from callback alone.
 */
export async function reconcileAndFulfillPayment(
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

  const order = asPaymentOrder(orderRow as Record<string, unknown>);

  if (order.status === "successful") {
    const fulfillment = await fulfillOrder(admin, order);
    if (fulfillment.ok) {
      await markFulfilledMetadata(admin, order.id, order.metadata as Record<string, unknown>);
      await recordPaymentLedger(admin, order);
    }
    return fulfillment.ok
      ? { ...fulfillment, alreadyFulfilled: true }
      : fulfillment;
  }

  if (
    order.status === "refunded" ||
    order.status === "failed" ||
    order.status === "cancelled"
  ) {
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

  // Server-side amount + currency validation — never trust client or raw webhook body
  const paidAmount = verified.amount;
  if (Math.abs(paidAmount - Number(order.amount)) > 0.01) {
    await markPaymentFailed(admin, order.id, "Amount mismatch");
    return { ok: false, error: "Payment amount mismatch", code: "amount_mismatch" };
  }

  if (
    verified.currency &&
    verified.currency.toUpperCase() !== String(order.currency).toUpperCase()
  ) {
    await markPaymentFailed(admin, order.id, "Currency mismatch");
    return { ok: false, error: "Payment currency mismatch", code: "currency_mismatch" };
  }

  const paidAt = verified.paidAt ?? new Date().toISOString();
  const claimed = await markPaymentSuccessful(admin, order.id, paidAt, {
    providerReference: verified.providerReference,
    channel: verified.channel,
    fees: verified.fees,
    gatewayResponse: verified.raw ?? null,
  });

  if (!claimed || claimed.status !== "successful") {
    const { data: current } = await admin
      .from("payment_orders")
      .select("*")
      .eq("id", order.id)
      .single();
    if (current?.status === "successful") {
      return fulfillOrder(admin, asPaymentOrder(current as Record<string, unknown>));
    }
    return { ok: false, error: "Could not confirm payment", code: "claim_failed" };
  }

  const fulfillment = await fulfillOrder(admin, claimed);
  if (fulfillment.ok) {
    await markFulfilledMetadata(
      admin,
      claimed.id,
      claimed.metadata as Record<string, unknown>
    );
    await recordPaymentLedger(admin, claimed);
    if (!fulfillment.alreadyFulfilled) {
      void notifyPaymentSuccessful(admin, claimed, fulfillment);
    }
  }

  return fulfillment;
}

async function recordPaymentLedger(
  admin: SupabaseClient,
  order: PaymentOrder
): Promise<void> {
  try {
    const { recordFinancialEvent } = await import("@/lib/financial/record-events");
    const orderType = String(order.order_type ?? "");
    const type =
      orderType === "subscription" || orderType === "lead_insights"
        ? ("subscription" as const)
        : orderType === "featured_listing" ||
            orderType === "boost_listing" ||
            orderType === "advertisement"
          ? ("promotion_credit" as const)
          : ("payment" as const);

    await recordFinancialEvent({
      admin,
      type,
      accountId: `user:${order.user_id}`,
      amount: Number(order.amount),
      currency: String(order.currency ?? "NGN"),
      reference: order.reference,
      capability: "financial.payment",
      provider: String(order.provider ?? order.gateway ?? "paystack"),
      actorId: order.user_id,
      status: "completed",
      paymentOrderId: order.id,
      metadata: {
        order_type: order.order_type,
        listing_id: order.listing_id ?? null,
      },
    });
  } catch {
    // Fail-soft — payment fulfillment must not roll back on ledger write errors
  }
}

async function markFulfilledMetadata(
  admin: SupabaseClient,
  orderId: string,
  existing: Record<string, unknown>
): Promise<void> {
  if (existing.fulfilled === true) return;
  await admin
    .from("payment_orders")
    .update({
      metadata: { ...existing, fulfilled: true, fulfilled_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);
}

/**
 * @deprecated Public clients must use getPaymentStatus.
 * Kept as alias for webhook/admin reconcile path.
 */
export async function verifyPayment(
  admin: SupabaseClient,
  reference: string
): Promise<PaymentFulfillmentResult> {
  return reconcileAndFulfillPayment(admin, reference);
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
  return data ? asPaymentOrder(data as Record<string, unknown>) : null;
}

export function isTerminalPaymentStatus(status: PaymentOrderStatus): boolean {
  return (
    status === "successful" ||
    status === "failed" ||
    status === "cancelled" ||
    status === "refunded"
  );
}

export type { VerifyPaymentResult };
