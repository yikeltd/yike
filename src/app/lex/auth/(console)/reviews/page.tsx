import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminReviewActions } from "@/components/admin/admin-review-actions";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { getReviewPublishingMode } from "@/lib/platform-settings";
import { parseAdminPage } from "@/lib/admin/pagination";

type Props = {
  searchParams: Promise<{
    status?: string;
    rating?: string;
    agent_id?: string;
    page?: string;
  }>;
};

export default async function AdminReviewsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { page, from, to } = parseAdminPage(sp);
  const supabase = createAdminClient();
  if (!supabase) {
    return <p className="text-sm text-muted">Database unavailable.</p>;
  }

  const mode = await getReviewPublishingMode();

  let query = supabase
    .from("agent_reviews")
    .select(
      `
      *,
      reviewer:profiles!agent_reviews_reviewer_id_fkey(id, full_name, email),
      agent:profiles!agent_reviews_agent_id_fkey(id, full_name, agent_type),
      replies:review_replies(id, body, status, created_at, user_id)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (sp.status) query = query.eq("status", sp.status);
  if (sp.rating) query = query.eq("rating", parseInt(sp.rating, 10));
  if (sp.agent_id) {
    query = query.or(`agent_id.eq.${sp.agent_id},company_id.eq.${sp.agent_id}`);
  }

  const { data: reviews, count } = await query;
  const total = count ?? 0;
  const pageParams = {
    status: sp.status,
    rating: sp.rating,
    agent_id: sp.agent_id,
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Review moderation"
        description={`Publishing mode: ${mode === "manual_review" ? "Manual review (default)" : "Auto publish"} · ${total} reviews`}
      />
      <AdminReviewActions reviews={reviews ?? []} currentStatus={sp.status} />
      <AdminPagination
        basePath="/lex/auth/reviews"
        total={total}
        page={page}
        params={pageParams}
      />
    </div>
  );
}
