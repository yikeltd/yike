import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const d30 = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [{ count: total30d }, { data: bySource }, { data: byType }, { data: topListings }] =
    await Promise.all([
      admin
        .from("listing_leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", d30),
      admin.from("listing_leads").select("lead_source").gte("created_at", d30),
      admin.from("listing_leads").select("lead_type").gte("created_at", d30),
      admin
        .from("listing_leads")
        .select("listing_id, listing:properties(title, city)")
        .gte("created_at", d30)
        .not("listing_id", "is", null),
    ]);

  const sourceCounts: Record<string, number> = {};
  for (const row of bySource ?? []) {
    const k = (row.lead_source as string) ?? "other";
    sourceCounts[k] = (sourceCounts[k] ?? 0) + 1;
  }

  const typeCounts: Record<string, number> = {};
  for (const row of byType ?? []) {
    const k = row.lead_type as string;
    typeCounts[k] = (typeCounts[k] ?? 0) + 1;
  }

  const listingCounts = new Map<string, { title: string; city: string; count: number }>();
  for (const row of topListings ?? []) {
    const lid = row.listing_id as string;
    const listing = row.listing as { title?: string; city?: string } | null;
    const prev = listingCounts.get(lid) ?? {
      title: listing?.title ?? "Listing",
      city: listing?.city ?? "",
      count: 0,
    };
    prev.count += 1;
    listingCounts.set(lid, prev);
  }

  const topSellers = await admin
    .from("listing_leads")
    .select("seller_id")
    .gte("created_at", d30);

  const sellerCounts = new Map<string, number>();
  for (const row of topSellers.data ?? []) {
    const id = row.seller_id as string;
    sellerCounts.set(id, (sellerCounts.get(id) ?? 0) + 1);
  }

  const [{ data: revenueRows }, { count: insightsSubs }] = await Promise.all([
    admin
      .from("payment_orders")
      .select("amount")
      .eq("order_type", "lead_insights")
      .eq("status", "successful")
      .gte("paid_at", d30),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gt("lead_insights_until", new Date().toISOString()),
  ]);

  const leadPackageRevenue = (revenueRows ?? []).reduce(
    (sum, r) => sum + Number(r.amount ?? 0),
    0
  );

  return NextResponse.json({
    volume30d: total30d ?? 0,
    bySource: sourceCounts,
    byType: typeCounts,
    topListings: [...listingCounts.entries()]
      .map(([id, v]) => ({ listingId: id, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    topSellerIds: [...sellerCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([sellerId, count]) => ({ sellerId, count })),
    leadPackageRevenue,
    leadPackageSubscribers: insightsSubs ?? 0,
  });
}
