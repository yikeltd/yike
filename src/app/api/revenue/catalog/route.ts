import { NextResponse } from "next/server";
import { getProductCatalog, getRevenueAnalytics } from "@/lib/revenue/service";

export const runtime = "nodejs";

/**
 * GET /api/revenue/catalog — Fetch product catalog & revenue analytics
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const includeAnalytics = searchParams.get("analytics") === "true";

    const catalog = getProductCatalog();
    const analytics = includeAnalytics ? getRevenueAnalytics() : undefined;

    return NextResponse.json({ catalog, analytics });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch catalog";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
