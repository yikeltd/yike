import { NextResponse } from "next/server";
import { getSession, getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { moderateReviewText } from "@/lib/reviews/moderation";
import { getReviewPublishingMode } from "@/lib/platform-settings";
import type { ReviewStatus } from "@/types/database";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Sign in to leave a review" }, { status: 401 });
  }

  const profile = await getProfile(user.id);
  if (!profile || profile.is_banned) {
    return NextResponse.json({ error: "Account not eligible" }, { status: 403 });
  }

  const body = (await req.json()) as {
    agent_id?: string;
    company_id?: string;
    listing_id?: string;
    rating?: number;
    review?: string;
  };

  const agentId = body.agent_id?.trim();
  const companyId = body.company_id?.trim();
  const rating = body.rating;
  const text = body.review?.trim() ?? "";

  if (!agentId && !companyId) {
    return NextResponse.json({ error: "Agent or company required" }, { status: 400 });
  }
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1–5 stars" }, { status: 400 });
  }

  const moderation = moderateReviewText(text);
  if (!moderation.ok) {
    return NextResponse.json({ error: moderation.reason }, { status: 400 });
  }

  if (agentId === user.id || companyId === user.id) {
    return NextResponse.json({ error: "You cannot review yourself" }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count: recentCount } = await supabase
    .from("agent_reviews")
    .select("*", { count: "exact", head: true })
    .eq("reviewer_id", user.id)
    .gte("created_at", since);

  if ((recentCount ?? 0) >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      { error: "Too many reviews. Try again later." },
      { status: 429 }
    );
  }

  const targetField = agentId ? "agent_id" : "company_id";
  const targetId = agentId ?? companyId!;

  const { data: existing } = await supabase
    .from("agent_reviews")
    .select("id, status")
    .eq("reviewer_id", user.id)
    .eq(targetField, targetId)
    .not("status", "in", '("rejected","hidden")')
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "You already reviewed this agent. Contact support to update." },
      { status: 409 }
    );
  }

  const mode = await getReviewPublishingMode();
  let status: ReviewStatus = "pending";
  let approved_at: string | null = null;

  if (mode === "auto_publish") {
    status = "approved";
    approved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("agent_reviews")
    .insert({
      reviewer_id: user.id,
      agent_id: agentId ?? null,
      company_id: companyId ?? null,
      listing_id: body.listing_id ?? null,
      rating,
      body: text,
      status,
      approved_at,
    })
    .select("id, status")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Duplicate review" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    id: data.id,
    status: data.status,
    message:
      status === "approved"
        ? "Review published. Thank you for sharing your experience."
        : "Review submitted for moderation. It will appear after approval.",
  });
}
