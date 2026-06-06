import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  const { id: reviewId } = await context.params;
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { reason, details } = (await req.json()) as {
    reason?: string;
    details?: string;
  };

  if (!reason?.trim()) {
    return NextResponse.json({ error: "Reason required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  await supabase.from("review_reports").insert({
    review_id: reviewId,
    reporter_id: user.id,
    reason: reason.trim(),
    details: details?.trim() ?? null,
  });

  await supabase
    .from("agent_reviews")
    .update({ status: "flagged", updated_at: new Date().toISOString() })
    .eq("id", reviewId)
    .eq("status", "approved");

  return NextResponse.json({ ok: true });
}
