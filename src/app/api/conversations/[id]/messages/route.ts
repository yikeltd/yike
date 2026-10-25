import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isMarketplaceMessagingEnabled,
  listMessages,
  sendMessage,
} from "@/lib/marketplace-messaging/service";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isMarketplaceMessagingEnabled()) {
    return NextResponse.json({ error: "Messaging is not available" }, { status: 503 });
  }

  const { id } = await context.params;
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const result = await listMessages(id, user.id);
  if (!result.ok) {
    const status = result.code === "forbidden" ? 403 : result.code === "not_found" ? 404 : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({ messages: result.messages });
}

/**
 * POST /api/conversations/[id]/messages — Send a message (free — no Yike Coins)
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isMarketplaceMessagingEnabled()) {
    return NextResponse.json({ error: "Messaging is not available" }, { status: 503 });
  }

  const { id } = await context.params;
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: { body?: string; clientMessageId?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await sendMessage({
    conversationId: id,
    senderId: user.id,
    body: body.body ?? "",
    clientMessageId: body.clientMessageId,
  });

  if (!result.ok) {
    const status =
      result.code === "forbidden" ? 403 : result.code === "not_found" ? 404 : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({ message: result.message });
}
