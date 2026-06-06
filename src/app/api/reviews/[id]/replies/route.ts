import { NextResponse } from "next/server";
import { getSession, getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { moderateReplyText } from "@/lib/reviews/moderation";
import { getReviewPublishingMode } from "@/lib/platform-settings";
import { isAdmin } from "@/lib/auth";
import type { ReplyStatus } from "@/types/database";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  const { id: reviewId } = await context.params;
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Sign in to reply" }, { status: 401 });
  }

  const profile = await getProfile(user.id);
  if (!profile || profile.is_banned) {
    return NextResponse.json({ error: "Account not eligible" }, { status: 403 });
  }

  const { body: text } = (await req.json()) as { body?: string };
  const moderation = moderateReplyText(text ?? "");
  if (!moderation.ok) {
    return NextResponse.json({ error: moderation.reason }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { data: review } = await supabase
    .from("agent_reviews")
    .select("id, reviewer_id, agent_id, company_id, status")
    .eq("id", reviewId)
    .single();

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const isReviewer = review.reviewer_id === user.id;
  const isAgent = review.agent_id === user.id || review.company_id === user.id;
  const isStaff = isAdmin(profile.role) || profile.role === "moderator";

  if (!isReviewer && !isAgent && !isStaff) {
    return NextResponse.json({ error: "Not allowed to reply" }, { status: 403 });
  }

  const mode = await getReviewPublishingMode();
  let status: ReplyStatus = "pending";
  let approved_at: string | null = null;

  if (mode === "auto_publish" && isStaff) {
    status = "approved";
    approved_at = new Date().toISOString();
  } else if (mode === "auto_publish" && (isAgent || isReviewer)) {
    status = "pending";
  }

  const { data, error } = await supabase
    .from("review_replies")
    .insert({
      review_id: reviewId,
      user_id: user.id,
      body: text!.trim(),
      status,
      approved_at,
    })
    .select("id, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    id: data.id,
    status: data.status,
    message:
      status === "approved"
        ? "Reply published."
        : "Reply submitted for moderation.",
  });
}
