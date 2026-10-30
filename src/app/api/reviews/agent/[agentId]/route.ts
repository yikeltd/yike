import { NextResponse } from "next/server";
import {
  getApprovedReviewsForAgent,
  getReviewStats,
} from "@/lib/reviews/queries";
import { getSampleAgentReviewsPreview } from "@/lib/sample-listings/review-fixtures";

export const runtime = "nodejs";

/** Public approved reviews snippet for seller contact cards (no auth). */
export async function GET(
  _request: Request,
  context: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await context.params;
  const id = agentId?.trim();
  if (!id) {
    return NextResponse.json({ error: "Agent id required" }, { status: 400 });
  }

  const samplePreview = getSampleAgentReviewsPreview(id);
  if (samplePreview) {
    return NextResponse.json(samplePreview);
  }

  const [stats, reviews] = await Promise.all([
    getReviewStats(id),
    getApprovedReviewsForAgent(id),
  ]);

  if (stats.total === 0) {
    return NextResponse.json({ stats, reviews: [] });
  }

  const preview = reviews.slice(0, 3).map((r) => ({
    id: r.id,
    rating: r.rating,
    body: r.body,
    created_at: r.created_at,
    reviewer: r.reviewer
      ? {
          full_name: r.reviewer.full_name,
          avatar_url: r.reviewer.avatar_url,
        }
      : null,
  }));

  return NextResponse.json({ stats, reviews: preview });
}
