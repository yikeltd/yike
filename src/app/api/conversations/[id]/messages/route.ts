import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { postConversationMessage } from "@/lib/conversations/service";

export const runtime = "nodejs";

/**
 * POST /api/conversations/[id]/messages — Send a message in the conversation workspace
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const senderId = session?.id ?? "buyer_guest_01";
    const senderName = session?.user_metadata?.full_name ?? "Buyer";
    const body = (await req.json()) as { message?: string };

    if (!body.message?.trim()) {
      return NextResponse.json({ error: "message body is required" }, { status: 400 });
    }

    const message = await postConversationMessage(id, senderId, senderName, body.message.trim());
    return NextResponse.json({ message });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to post message";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
