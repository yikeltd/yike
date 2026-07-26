import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * GET /api/admin/payments/transactions
 * Staff: search transactions by reference, status, purpose.
 */
export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const status = url.searchParams.get("status")?.trim() ?? "";
  const purpose = url.searchParams.get("purpose")?.trim() ?? "";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50), 1), 200);

  let query = admin
    .from("payment_orders")
    .select(
      "id, user_id, reference, order_type, amount, currency, status, listing_id, entity_id, provider, gateway, channel, fees, paystack_reference, paid_at, created_at, updated_at, metadata"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);
  if (purpose) query = query.eq("order_type", purpose);
  if (q) {
    query = query.or(
      `reference.ilike.%${q}%,paystack_reference.ilike.%${q}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    // Migration not applied — query without new columns
    if (/listing_id|gateway|channel|fees|paystack_reference|column/i.test(error.message)) {
      let fallback = admin
        .from("payment_orders")
        .select(
          "id, user_id, reference, order_type, amount, currency, status, entity_id, provider, paid_at, created_at, updated_at, metadata"
        )
        .order("created_at", { ascending: false })
        .limit(limit);
      if (status) fallback = fallback.eq("status", status);
      if (purpose) fallback = fallback.eq("order_type", purpose);
      if (q) fallback = fallback.ilike("reference", `%${q}%`);
      const fb = await fallback;
      if (fb.error) {
        return NextResponse.json({ error: fb.error.message }, { status: 500 });
      }
      return NextResponse.json({
        ok: true,
        transactions: fb.data ?? [],
        migrationPending: true,
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Summary buckets for admin dashboard strip
  const { data: statusRows } = await admin
    .from("payment_orders")
    .select("status, amount")
    .in("status", ["pending", "processing", "successful", "failed"]);

  const summary = {
    pending: 0,
    processing: 0,
    successful: 0,
    failed: 0,
    revenueSuccessful: 0,
  };
  for (const row of statusRows ?? []) {
    const s = row.status as keyof typeof summary;
    if (s in summary && s !== "revenueSuccessful") {
      summary[s] += 1;
    }
    if (row.status === "successful") {
      summary.revenueSuccessful += Number(row.amount) || 0;
    }
  }

  return NextResponse.json({
    ok: true,
    transactions: data ?? [],
    summary,
  });
}
