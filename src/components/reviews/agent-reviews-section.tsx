import { getApprovedReviewsForAgent, getReviewStats } from "@/lib/reviews/queries";
import { getSession } from "@/lib/auth";
import { ReviewSummaryHeader } from "@/components/reviews/review-summary";
import { ReviewList } from "@/components/reviews/review-list";
import { ReviewForm } from "@/components/reviews/review-form";

export async function AgentReviewsSection({
  agentId,
  isAgency,
}: {
  agentId: string;
  isAgency?: boolean;
}) {
  const [stats, reviews, session] = await Promise.all([
    getReviewStats(agentId),
    getApprovedReviewsForAgent(agentId),
    getSession(),
  ]);

  return (
    <section id="reviews" className="scroll-mt-24 space-y-4">
      <h2 className="text-sm font-bold text-navy lg:text-base">Reviews</h2>
      <ReviewSummaryHeader stats={stats} />
      <ReviewForm agentId={agentId} isAgency={isAgency} />
      <ReviewList
        reviews={reviews}
        agentId={agentId}
        currentUserId={session?.id}
      />
    </section>
  );
}
