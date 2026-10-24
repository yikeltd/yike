import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startMarketplaceCall } from "@/lib/video-calls/sessions";

export const runtime = "nodejs";

export async function POST(request: Request) {
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

  let body: {
    calleeId?: string;
    listingId?: string;
    conversationId?: string;
    callType?: "voice" | "video";
    idempotencyKey?: string;
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const calleeId = body.calleeId?.trim();
  const callType = body.callType ?? "video";
  const idempotencyKey = body.idempotencyKey?.trim();

  if (!calleeId || !idempotencyKey) {
    return NextResponse.json({ error: "calleeId and idempotencyKey required" }, { status: 400 });
  }

  const result = await startMarketplaceCall({
    callerId: user.id,
    calleeId,
    listingId: body.listingId ?? null,
    conversationId: body.conversationId ?? null,
    callType,
    idempotencyKey,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: 400 });
  }

  return NextResponse.json({ session: result.session, reused: result.reused });
}
