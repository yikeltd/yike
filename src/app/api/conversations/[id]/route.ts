import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getConversationWorkspaceById } from "@/lib/conversations/service";

export const runtime = "nodejs";

/**
 * GET /api/conversations/[id] — Fetch detailed conversation workspace
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const userId = session?.id ?? "buyer_guest_01";

    const workspace = await getConversationWorkspaceById(id, userId);
    if (!workspace) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({ workspace });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch conversation workspace";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
