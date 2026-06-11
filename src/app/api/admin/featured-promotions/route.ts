import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ListingPromotion, ListingPromotionStatus } from "@/types/database";

export const runtime = "nodejs";

const STATUSES: ListingPromotionStatus[] = [
  "pending",
  "paid",
  "active",
  "expired",
  "cancelled",
  "failed",
];

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
  const status = url.searchParams.get("status")?.trim() as ListingPromotionStatus | undefined;
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);

  let query = admin
    .from("listing_promotions")
    .select(
      `
      *,
      listing:properties!listing_promotions_listing_id_fkey (
        id, title, area, city, status, is_featured, featured_until
      ),
      user:profiles!listing_promotions_user_id_fkey (
        id, full_name, email
      )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status && STATUSES.includes(status)) {
    query = query.eq("status", status);
  }

  const { data, count, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    promotions: (data ?? []) as ListingPromotion[],
    total: count ?? 0,
  });
}
