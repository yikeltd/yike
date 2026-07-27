import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOrCreateConversationWorkspace } from "@/lib/conversations/service";

export const runtime = "nodejs";

/**
 * POST /api/conversations — Initiate or get existing 1-per-listing conversation for buyer
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    const buyerId = session?.id ?? "buyer_guest_01";
    const body = (await req.json()) as { listingId?: string };

    if (!body.listingId) {
      return NextResponse.json({ error: "listingId is required" }, { status: 400 });
    }

    const workspace = await getOrCreateConversationWorkspace(body.listingId, buyerId);
    return NextResponse.json({ workspace });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create conversation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
