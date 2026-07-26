import { NextResponse } from "next/server";
import { createAdminClient, tryCreateAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getFinancialPlatform } from "@/lib/financial";
import { friendlyPublicError } from "@/lib/copy/public-errors";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ reference: string }> };

/**
 * GET /api/payments/verify/:reference
 * Status poll only — does NOT activate products.
 * Activation happens only via signed webhook + Paystack API verify.
 */
export async function GET(_request: Request, ctx: RouteCtx) {
  const { reference: raw } = await ctx.params;
  const reference = decodeURIComponent(raw ?? "").trim();
  if (!reference) {
    return NextResponse.json({ error: "Reference required" }, { status: 400 });
  }

  const admin = tryCreateAdminClient() ?? createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: friendlyPublicError("unavailable") }, { status: 503 });
  }

  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  const { data: order } = await admin
    .from("payment_orders")
    .select("user_id")
    .eq("reference", reference)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Payment not found", code: "not_found" }, { status: 404 });
  }

  // Allow poll without auth (callback redirect), but block cross-user when signed in
  if (user && order.user_id && order.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const result = await getFinancialPlatform().payment.status(admin, reference);
  if (!result.ok) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: 404 });
  }

  const { payment } = result;
  const isPending =
    payment.status === "pending" || payment.status === "processing";

  return NextResponse.json(
    {
      ok: true,
      reference: payment.reference,
      status: payment.status,
      purpose: payment.purpose,
      amount: payment.amount,
      currency: payment.currency,
      listingId: payment.listingId,
      paidAt: payment.paidAt,
      fulfilled: payment.status === "successful",
    },
    { status: isPending ? 202 : 200 }
  );
}
