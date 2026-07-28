import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSellerCrmSnapshot } from "@/lib/seller-crm/service";

export const runtime = "nodejs";

/**
 * GET /api/seller-crm — Fetch complete Seller CRM snapshot
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    const sellerId = session?.id ?? "seller_01";
    const snapshot = await getSellerCrmSnapshot(sellerId);
    return NextResponse.json({ snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch Seller CRM snapshot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
