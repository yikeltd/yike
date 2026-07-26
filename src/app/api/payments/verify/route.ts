import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getFinancialPlatform } from "@/lib/financial";
import { friendlyPublicError } from "@/lib/copy/public-errors";

export const runtime = "nodejs";

/**
 * Legacy verify endpoint — status poll only (no activation).
 * Prefer GET /api/payments/verify/:reference
 */
async function statusForReference(reference: string) {
  const admin = createAdminClient();
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

  if (order?.user_id && user && order.user_id !== user.id) {
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
      orderType: payment.purpose,
      amount: payment.amount,
      currency: payment.currency,
      listingId: payment.listingId,
      paidAt: payment.paidAt,
      fulfilled: payment.status === "successful",
      // Compatibility fields — no activation timestamps from this poll
      alreadyFulfilled: payment.status === "successful",
      featuredUntil: null,
      boostedUntil: null,
    },
    { status: isPending ? 202 : 200 }
  );
}

export async function POST(request: Request) {
  let body: { reference?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const reference = String(body.reference ?? "").trim();
  if (!reference) {
    return NextResponse.json({ error: "Reference required" }, { status: 400 });
  }

  return statusForReference(reference);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference =
    url.searchParams.get("reference")?.trim() ||
    url.searchParams.get("trxref")?.trim() ||
    "";

  if (!reference) {
    return NextResponse.json({ error: "Reference required" }, { status: 400 });
  }

  return statusForReference(reference);
}
