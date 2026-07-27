import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { respondToOffer, submitOffer } from "@/lib/conversations/service";
import type { OfferStatus } from "@/lib/conversations/types";

export const runtime = "nodejs";

/**
 * POST /api/conversations/[id]/offers — Submit or respond to an offer
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const actorId = session?.id ?? "buyer_guest_01";
    const actorName = session?.user_metadata?.full_name ?? "Buyer";
    const body = (await req.json()) as {
      action: "submit" | "respond";
      amount?: number;
      terms?: string;
      status?: OfferStatus;
      counterAmount?: number;
    };

    if (body.action === "submit") {
      if (!body.amount || body.amount <= 0) {
        return NextResponse.json({ error: "valid offer amount is required" }, { status: 400 });
      }
      const offer = await submitOffer(id, actorId, actorName, body.amount, body.terms);
      return NextResponse.json({ offer });
    }

    if (body.action === "respond") {
      if (!body.status) {
        return NextResponse.json({ error: "offer status is required" }, { status: 400 });
      }
      const offer = await respondToOffer(id, actorId, actorName, body.status, body.counterAmount);
      return NextResponse.json({ offer });
    }

    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process offer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
