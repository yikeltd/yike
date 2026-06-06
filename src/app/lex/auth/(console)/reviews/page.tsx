import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminReviewActions } from "@/components/admin/admin-review-actions";
import { getReviewPublishingMode } from "@/lib/platform-settings";

type Props = {
  searchParams: Promise<{ status?: string; rating?: string; agent_id?: string }>;
};

export default async function AdminReviewsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = createAdminClient();
  if (!supabase) {
    return <p className="text-sm text-muted">Database unavailable.</p>;
  }

  const mode = await getReviewPublishingMode();

  let query = supabase
    .from("agent_reviews")
    .select(`
      *,
      reviewer:profiles!agent_reviews_reviewer_id_fkey(id, full_name, email),
      agent:profiles!agent_reviews_agent_id_fkey(id, full_name, agent_type),
      replies:review_replies(id, body, status, created_at, user_id)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (sp.status) query = query.eq("status", sp.status);
  if (sp.rating) query = query.eq("rating", parseInt(sp.rating, 10));
  if (sp.agent_id) {
    query = query.or(`agent_id.eq.${sp.agent_id},company_id.eq.${sp.agent_id}`);
  }

  const { data: reviews } = await query;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Review moderation"
        description={`Publishing mode: ${mode === "manual_review" ? "Manual review (default)" : "Auto publish"}`}
      />
      <AdminReviewActions reviews={reviews ?? []} currentStatus={sp.status} />
    </div>
  );
}
