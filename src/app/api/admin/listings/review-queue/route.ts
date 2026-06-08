import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  REVIEW_QUEUE_LABELS,
  type ReviewQueueGroup,
} from "@/lib/review-memory";
import {
  persistListingReviewScores,
  recalculateListingReview,
} from "@/lib/review-memory/recalculate";
import type { Property, Profile } from "@/types/database";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(req.url);
  const group = url.searchParams.get("group") as ReviewQueueGroup | null;
  const status = url.searchParams.get("status") ?? "pending";
  const limit = Math.min(100, Number(url.searchParams.get("limit") ?? 50));

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  let query = admin
    .from("properties")
    .select(
      `id, title, price, city, area, status, listing_type, property_type, media_urls,
       review_overall_score, review_risk_level, review_suggested_action, review_queue_group,
       review_scores, review_visibility_modifier, review_hold_status, created_at,
       agent:profiles!properties_agent_id_fkey (id, full_name, verified_badge, verification_status, role)`,
      { count: "exact" }
    )
    .eq("status", status)
    .order("review_overall_score", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (group) query = query.eq("review_queue_group", group);

  const { data, count, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const listings = (data ?? []) as unknown as (Property & {
    agent: Profile | null;
  })[];

  const needsScore = listings.filter((l) => !l.review_overall_score);
  for (const listing of needsScore.slice(0, 20)) {
    const result = await recalculateListingReview(admin, listing);
    await persistListingReviewScores(admin, listing.id, result);
    listing.review_overall_score = result.judgment.scores.overall;
    listing.review_risk_level = result.judgment.riskLevel;
    listing.review_suggested_action = result.suggestedAction;
    listing.review_queue_group = result.queueGroup;
    listing.review_scores = {
      ...result.judgment.scores,
      good: result.judgment.good,
      attention: result.judgment.attention,
    };
  }

  const groups: Record<string, number> = {};
  for (const g of Object.keys(REVIEW_QUEUE_LABELS) as ReviewQueueGroup[]) {
    const { count: gc } = await admin
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", status)
      .eq("review_queue_group", g);
    groups[g] = gc ?? 0;
  }

  return NextResponse.json({
    listings,
    total: count ?? 0,
    groups,
    groupLabels: REVIEW_QUEUE_LABELS,
  });
}
