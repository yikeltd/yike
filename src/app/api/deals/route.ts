import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOrCreateDealForConversation, getCommerceFunnelMetrics, listDeals } from "@/lib/commerce/service";
import type { DealStage, DealStatus } from "@/lib/commerce/types";

export const runtime = "nodejs";

/**
 * GET /api/deals — List deals or commerce funnel metrics
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const metricsParam = searchParams.get("metrics");

    if (metricsParam === "true") {
      const metrics = await getCommerceFunnelMetrics();
      return NextResponse.json({ metrics });
    }

    const buyerId = searchParams.get("buyerId") || undefined;
    const sellerId = searchParams.get("sellerId") || undefined;
    const stage = (searchParams.get("stage") as DealStage) || undefined;
    const status = (searchParams.get("status") as DealStatus) || undefined;

    const deals = await listDeals({ buyerId, sellerId, stage, status });
    return NextResponse.json({ deals });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch deals";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/deals — Create or sync deal for a conversation
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    const actorId = session?.id ?? "buyer_guest_01";
    const body = (await req.json()) as {
      conversationId: string;
      listingId: string;
      buyerId?: string;
      sellerId: string;
      initialValue?: number;
    };

    if (!body.conversationId || !body.listingId || !body.sellerId) {
      return NextResponse.json({ error: "conversationId, listingId, and sellerId are required" }, { status: 400 });
    }

    const deal = await getOrCreateDealForConversation(
      body.conversationId,
      body.listingId,
      body.buyerId ?? actorId,
      body.sellerId,
      body.initialValue
    );

    return NextResponse.json({ deal });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create deal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
