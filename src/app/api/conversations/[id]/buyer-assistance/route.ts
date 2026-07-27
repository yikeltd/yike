import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { engageBuyerAssistance } from "@/lib/conversations/service";
import type { BuyerAssistanceServiceType } from "@/lib/conversations/types";

export const runtime = "nodejs";

/**
 * POST /api/conversations/[id]/buyer-assistance — Engage Buyer Assistance concierge
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
      serviceType?: BuyerAssistanceServiceType;
      notes?: string;
    };

    if (!body.serviceType) {
      return NextResponse.json({ error: "serviceType is required" }, { status: 400 });
    }

    const assistance = await engageBuyerAssistance(
      id,
      actorId,
      actorName,
      body.serviceType,
      body.notes
    );

    return NextResponse.json({ assistance });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to engage buyer assistance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
