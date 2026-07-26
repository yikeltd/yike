import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { friendlyPublicError } from "@/lib/copy/public-errors";

export const runtime = "nodejs";

/**
 * GET /api/payments/history
 * Authenticated user's payment transactions (newest first).
 */
export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 30), 1), 100);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: friendlyPublicError("unavailable") }, { status: 503 });
  }

  const { data, error, count } = await admin
    .from("payment_orders")
    .select(
      "id, reference, order_type, amount, currency, status, listing_id, entity_id, paid_at, created_at, updated_at, metadata",
      { count: "exact" }
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    // Fallback without listing_id if migration not applied
    if (/listing_id|column/i.test(error.message)) {
      const fallback = await admin
        .from("payment_orders")
        .select(
          "id, reference, order_type, amount, currency, status, entity_id, paid_at, created_at, updated_at, metadata",
          { count: "exact" }
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (fallback.error) {
        return NextResponse.json({ error: friendlyPublicError("unavailable") }, { status: 503 });
      }

      return NextResponse.json({
        ok: true,
        transactions: (fallback.data ?? []).map(mapRow),
        total: fallback.count ?? 0,
        limit,
        offset,
      });
    }
    return NextResponse.json({ error: friendlyPublicError("unavailable") }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    transactions: (data ?? []).map(mapRow),
    total: count ?? 0,
    limit,
    offset,
  });
}

function mapRow(row: Record<string, unknown>) {
  const metadata = (row.metadata ?? {}) as Record<string, unknown>;
  return {
    id: row.id,
    reference: row.reference,
    purpose: row.order_type,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    listingId: row.listing_id ?? metadata.listing_id ?? null,
    entityId: row.entity_id ?? null,
    paidAt: row.paid_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
