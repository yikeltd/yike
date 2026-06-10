import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  REVIEW_QUEUE_LABELS,
  type ReviewQueueGroup,
} from "@/lib/review-memory";
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

  const { data: groupRows } = await admin
    .from("properties")
    .select("review_queue_group")
    .eq("status", status);

  const groups: Record<string, number> = {};
  for (const g of Object.keys(REVIEW_QUEUE_LABELS) as ReviewQueueGroup[]) {
    groups[g] = 0;
  }
  for (const row of groupRows ?? []) {
    const key = row.review_queue_group as ReviewQueueGroup | null;
    if (key && key in groups) groups[key] += 1;
  }

  return NextResponse.json({
    listings,
    total: count ?? 0,
    groups,
    groupLabels: REVIEW_QUEUE_LABELS,
  });
}
