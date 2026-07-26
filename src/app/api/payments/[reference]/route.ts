import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFinancialPlatform } from "@/lib/financial";
import { friendlyPublicError } from "@/lib/copy/public-errors";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ reference: string }> };

/**
 * GET /api/payments/:reference
 * Owner (or staff via admin tools) can inspect a transaction.
 * Status only — no activation.
 */
export async function GET(_request: Request, ctx: RouteCtx) {
  const { reference: raw } = await ctx.params;
  const reference = decodeURIComponent(raw ?? "").trim();

  // Avoid colliding with static segments if router ever falls through
  if (!reference || ["initialize", "verify", "webhook", "history"].includes(reference)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: friendlyPublicError("unavailable") }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: friendlyPublicError("unavailable") }, { status: 503 });
  }

  const { data: order } = await admin
    .from("payment_orders")
    .select("user_id")
    .eq("reference", reference)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (order.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const result = await getFinancialPlatform().payment.status(admin, reference);
  if (!result.ok) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: 404 });
  }

  return NextResponse.json({ ok: true, payment: result.payment });
}
