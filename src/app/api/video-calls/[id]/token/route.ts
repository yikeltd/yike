import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCallProviderSession } from "@/lib/video-calls/provider";

export const runtime = "nodejs";

/**
 * Mint Agora credentials for an authenticated participant on a connected call.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
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

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const { data: session } = await admin
    .from("video_call_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  const callerId = session.caller_id as string;
  const calleeId = session.callee_id as string;
  if (user.id !== callerId && user.id !== calleeId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (session.status !== "connected") {
    return NextResponse.json(
      { error: "Call is not connected", code: "invalid_state" },
      { status: 400 }
    );
  }

  const provider = await createCallProviderSession({
    sessionId: id,
    callerId,
    calleeId,
    callType: session.call_type as "voice" | "video",
    participantUserId: user.id,
  });

  return NextResponse.json({
    provider,
    providerConfigured: provider.configured,
  });
}
