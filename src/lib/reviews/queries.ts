import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AgentReview, ReviewReply, ReviewStats } from "@/types/database";

export async function getApprovedReviewsForAgent(agentId: string) {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("agent_reviews")
    .select(`
      *,
      reviewer:profiles!agent_reviews_reviewer_id_fkey(id, full_name, avatar_url),
      replies:review_replies(
        id, body, status, created_at, user_id,
        author:profiles!review_replies_user_id_fkey(id, full_name, avatar_url, role)
      )
    `)
    .or(`agent_id.eq.${agentId},company_id.eq.${agentId}`)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(50);

  const reviews = (data ?? []) as (AgentReview & {
    reviewer?: { id: string; full_name: string | null; avatar_url: string | null };
    replies?: (ReviewReply & { author?: { id: string; full_name: string | null; role: string } })[];
  })[];

  return reviews.map((r) => ({
    ...r,
    replies: (r.replies ?? []).filter((rep) => rep.status === "approved"),
  }));
}

export async function getReviewStats(agentId: string): Promise<ReviewStats> {
  const supabase = createAdminClient();
  if (!supabase) {
    return { average: 0, total: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  }

  const { data } = await supabase
    .from("agent_reviews")
    .select("rating")
    .or(`agent_id.eq.${agentId},company_id.eq.${agentId}`)
    .eq("status", "approved");

  const ratings = (data ?? []).map((r) => r.rating as number);
  const total = ratings.length;
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;

  for (const r of ratings) {
    if (r >= 1 && r <= 5) breakdown[r as 1 | 2 | 3 | 4 | 5]++;
  }

  const average =
    total > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / total) * 10) / 10 : 0;

  return { average, total, breakdown };
}

export function formatReviewSummary(stats: ReviewStats): string {
  if (stats.total === 0) return "No reviews yet";
  return `${stats.average} stars · ${stats.total} review${stats.total === 1 ? "" : "s"}`;
}
