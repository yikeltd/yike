import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { reconcileAndFulfillPayment } from "@/lib/payments/services/payment-service";
import { isPaystackConfigured, isPaymentsRuntimeEnabled } from "@/lib/payments/config";

export const runtime = "nodejs";

/**
 * POST /api/payments/reconcile — Verify with Paystack API and fulfil once (owner only).
 * Safe retry path when webhook is delayed; never credits from redirect alone.
 */
export async function POST(request: Request) {
  if (!isPaymentsRuntimeEnabled() || !isPaystackConfigured()) {
    return NextResponse.json({ error: "Payments are not available" }, { status: 503 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: { reference?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const reference = body.reference?.trim();
  if (!reference) {
    return NextResponse.json({ error: "Reference required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const { data: order } = await admin
    .from("payment_orders")
    .select("user_id, order_type, status")
    .eq("reference", reference)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Payment not found", code: "not_found" }, { status: 404 });
  }

  if (order.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const result = await reconcileAndFulfillPayment(admin, reference);

  if (!result.ok) {
    const status =
      result.code === "pending"
        ? 202
        : result.code === "not_found"
          ? 404
          : result.code === "verify_failed"
            ? 502
            : 400;
    return NextResponse.json(
      { error: result.error, code: result.code, status: order.status },
      { status },
    );
  }

  const metadata = (result.order.metadata ?? {}) as Record<string, unknown>;

  return NextResponse.json({
    ok: true,
    reference,
    orderType: result.order.order_type,
    alreadyFulfilled: result.alreadyFulfilled,
    walletTopup:
      result.order.order_type === "wallet_topup"
        ? {
            coinsCredited: metadata.yike_coins_credited ?? null,
            balanceAfter: metadata.yike_coins_balance_after ?? null,
          }
        : null,
  });
}
