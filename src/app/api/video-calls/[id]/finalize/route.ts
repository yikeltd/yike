import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { finalizeMarketplaceCallSession } from "@/lib/video-calls/sessions";

export const runtime = "nodejs";

const TERMINAL = new Set(["failed", "declined", "missed", "cancelled", "ended"]);

export async function POST(
  request: Request,
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

  let body: { status?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const status = body.status?.trim().toLowerCase();
  if (!status || !TERMINAL.has(status)) {
    return NextResponse.json({ error: "Invalid terminal status" }, { status: 400 });
  }

  const result = await finalizeMarketplaceCallSession(
    id,
    user.id,
    status as "failed" | "declined" | "missed" | "cancelled" | "ended"
  );

  if (!result.ok) {
    const status =
      result.code === "forbidden"
        ? 403
        : result.code === "not_found"
          ? 404
          : result.code === "already_finalized"
            ? 409
            : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({ session: result.session, reused: result.reused });
}
