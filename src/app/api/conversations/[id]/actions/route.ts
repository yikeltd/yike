import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { executeConversationAction } from "@/lib/conversations/service";
import type { TransactionActionType } from "@/lib/conversations/types";

export const runtime = "nodejs";

/**
 * POST /api/conversations/[id]/actions — Execute a transaction action within the conversation
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
    const body = (await req.json()) as { action?: TransactionActionType; payload?: Record<string, unknown> };

    if (!body.action) {
      return NextResponse.json({ error: "action parameter is required" }, { status: 400 });
    }

    const workspace = await executeConversationAction(
      id,
      actorId,
      actorName,
      body.action,
      body.payload
    );

    return NextResponse.json({ workspace });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to execute transaction action";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
