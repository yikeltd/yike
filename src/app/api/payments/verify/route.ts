import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { verifyPayment } from "@/lib/payments/services/payment-service";
import { friendlyPublicError } from "@/lib/copy/public-errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: friendlyPublicError("unavailable") }, { status: 503 });
  }

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

  const result = await verifyPayment(admin, reference);

  if (!result.ok) {
    const status =
      result.code === "not_found"
        ? 404
        : result.code === "pending"
          ? 202
          : 400;
    return NextResponse.json(
      { ok: false, error: result.error, code: result.code },
      { status }
    );
  }

  return NextResponse.json({
    ok: true,
    alreadyFulfilled: result.alreadyFulfilled,
    orderType: result.order.order_type,
    featuredUntil: result.featuredUntil ?? null,
    boostedUntil: result.boostedUntil ?? null,
    listingId: result.listingId ?? null,
    reference: result.order.reference,
  });
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

  const post = new Request(request.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reference }),
  });

  return POST(post);
}
