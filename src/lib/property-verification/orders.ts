import type { SupabaseClient } from "@supabase/supabase-js";
import type { PropertyVerificationOrder } from "@/types/database";
import {
  isPackageId,
  type PropertyVerificationPackageId,
} from "@/lib/property-verification/packages";
import { packageAmount } from "@/lib/property-verification/pricing";
import { createStaffOpsAlert } from "@/lib/verification/ops-alerts";
import { appendTrustTimeline } from "@/lib/trust/operations/timeline";
import { grantTrustBadge } from "@/lib/trust/operations/badges";
import { logPaymentAudit } from "@/lib/payments/audit";

export type OrderActionResult =
  | { ok: true; order: PropertyVerificationOrder }
  | { ok: false; error: string; code?: string };

function orderReference(): string {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `YVO-${Date.now().toString(36).toUpperCase()}-${suffix}`;
}

export async function getVerificationOrderForRequest(
  admin: SupabaseClient,
  requestId: string
): Promise<PropertyVerificationOrder | null> {
  const { data } = await admin
    .from("property_verification_orders")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as PropertyVerificationOrder | null) ?? null;
}

export async function createPaidVerificationOrder(
  admin: SupabaseClient,
  input: {
    userId: string;
    requestId: string;
    packageType: PropertyVerificationPackageId;
    paymentOrderId: string;
    paymentReference: string;
  }
): Promise<OrderActionResult> {
  const existing = await getVerificationOrderForRequest(admin, input.requestId);
  if (existing && ["paid", "assigned", "in_progress", "completed"].includes(existing.status)) {
    return { ok: true, order: existing };
  }

  const { data: request } = await admin
    .from("property_verification_requests")
    .select(
      "id, request_reference, property_id, listing_agent_id, requester_user_id, property_title, property_location_text, is_diaspora_request"
    )
    .eq("id", input.requestId)
    .single();

  if (!request) {
    return { ok: false, error: "Verification request not found", code: "not_found" };
  }

  const now = new Date().toISOString();
  const amount = await packageAmount(admin, input.packageType);
  if (amount == null) {
    return { ok: false, error: "Package pricing unavailable", code: "pricing_unavailable" };
  }
  const verificationRef = orderReference();

  const { data: order, error } = await admin
    .from("property_verification_orders")
    .insert({
      user_id: input.userId,
      request_id: input.requestId,
      property_id: request.property_id,
      seller_id: request.listing_agent_id,
      package_type: input.packageType,
      amount,
      status: "paid",
      payment_reference: input.paymentReference,
      payment_order_id: input.paymentOrderId,
      verification_reference: verificationRef,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error || !order) {
    return { ok: false, error: error?.message ?? "Could not create verification order" };
  }

  await admin
    .from("property_verification_requests")
    .update({
      payment_status: "paid",
      payment_reference: input.paymentReference,
      admin_fee: amount,
      status: "awaiting_assignment",
      updated_at: now,
    })
    .eq("id", input.requestId);

  await createStaffOpsAlert(admin, {
    alertType: "property_verification_paid",
    title: "Property verification paid",
    body: `${request.property_title ?? "Property"} · ${input.packageType} · ${verificationRef}`,
    referenceType: "property_verification_order",
    referenceId: verificationRef,
    priority: request.is_diaspora_request ? "high" : "normal",
  });

  await appendTrustTimeline(admin, {
    caseType: "property_verification",
    caseId: input.requestId,
    caseReference: request.request_reference,
    eventType: "payment_received",
    title: "Verification package paid",
    detail: `${input.packageType} · ₦${amount.toLocaleString("en-NG")}`,
    metadata: { orderId: order.id, packageType: input.packageType },
  });

  logPaymentAudit({
    action: "verification_request_created",
    actorId: input.userId,
    targetId: input.paymentOrderId,
    targetUserId: input.userId,
    metadata: {
      property_verification_order_id: order.id,
      package_type: input.packageType,
      reference: verificationRef,
    },
  });

  return { ok: true, order: order as PropertyVerificationOrder };
}

export async function updateVerificationOrderStatus(
  admin: SupabaseClient,
  orderId: string,
  status: PropertyVerificationOrder["status"],
  actorId: string,
  extra?: Record<string, unknown>
): Promise<OrderActionResult> {
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status,
    updated_at: now,
    ...(extra ?? {}),
  };
  if (status === "completed") {
    patch.completed_at = now;
  }

  const { data, error } = await admin
    .from("property_verification_orders")
    .update(patch)
    .eq("id", orderId)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not update order" };
  }

  const order = data as PropertyVerificationOrder;

  if (order.request_id) {
    const requestStatus =
      status === "assigned"
        ? "assigned"
        : status === "in_progress"
          ? "in_progress"
          : status === "completed"
            ? "delivered"
            : status === "cancelled"
              ? "cancelled"
              : undefined;

    if (requestStatus) {
      await admin
        .from("property_verification_requests")
        .update({ status: requestStatus, updated_at: now })
        .eq("id", order.request_id);
    }
  }

  if (status === "completed" && order.property_id) {
    await admin
      .from("properties")
      .update({
        physically_verified_at: now,
        internal_trust_status: "physically_reviewed",
        updated_at: now,
      })
      .eq("id", order.property_id);

    await grantTrustBadge(admin, {
      entityType: "property",
      entityId: order.property_id,
      badgeType: "physically_reviewed",
      grantedBy: actorId,
      adminNotes: order.verification_reference ?? undefined,
    });
  }

  await createStaffOpsAlert(admin, {
    alertType: `property_verification_${status}`,
    title: `Verification order ${status.replace("_", " ")}`,
    body: order.verification_reference ?? orderId,
    referenceType: "property_verification_order",
    referenceId: order.verification_reference ?? orderId,
    priority: status === "paid" ? "high" : "normal",
  });

  return { ok: true, order };
}

export function validatePackageCheckout(
  packageType: string,
  requestId: string
): { ok: true; packageType: PropertyVerificationPackageId } | { ok: false; error: string } {
  if (!requestId.trim()) {
    return { ok: false, error: "Request reference missing" };
  }
  if (!isPackageId(packageType)) {
    return { ok: false, error: "Choose a verification package" };
  }
  return { ok: true, packageType };
}
