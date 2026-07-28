import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getInventoryHealthList, getPerformanceInsights } from "@/lib/seller-crm/service";

export const runtime = "nodejs";

/**
 * GET /api/seller-crm/insights — Fetch performance insights & inventory health
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    const sellerId = session?.id ?? "seller_01";
    const insights = getPerformanceInsights(sellerId);
    const inventoryHealth = getInventoryHealthList(sellerId);

    return NextResponse.json({ insights, inventoryHealth });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch insights";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
