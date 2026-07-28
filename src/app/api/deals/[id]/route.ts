import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDealById, transitionDealStage } from "@/lib/commerce/service";
import type { DealStage } from "@/lib/commerce/types";

export const runtime = "nodejs";

/**
 * GET /api/deals/[id] — Fetch detailed deal record
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deal = await getDealById(id);
    if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    return NextResponse.json({ deal });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch deal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/deals/[id] — Transition stage, update value, or complete deal
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const actorId = session?.id ?? "buyer_guest_01";
    const actorName = session?.user_metadata?.full_name ?? "Party";
    const body = (await req.json()) as {
      toStage: DealStage;
      newValue?: number;
      reason?: string;
    };

    if (!body.toStage) {
      return NextResponse.json({ error: "toStage parameter is required" }, { status: 400 });
    }

    const updatedDeal = await transitionDealStage(
      id,
      body.toStage,
      actorId,
      actorName,
      body.newValue,
      body.reason
    );

    return NextResponse.json({ deal: updatedDeal });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update deal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
