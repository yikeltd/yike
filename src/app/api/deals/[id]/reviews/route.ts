import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { submitGatedReview } from "@/lib/commerce/service";

export const runtime = "nodejs";

/**
 * POST /api/deals/[id]/reviews — Submit post-deal review (Gated by DealCompletion)
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const reviewerId = session?.id ?? "buyer_guest_01";
    const reviewerName = session?.user_metadata?.full_name ?? "Buyer";
    const body = (await req.json()) as {
      reviewerRole: "buyer" | "seller";
      targetUserId: string;
      rating: number;
      feedback: string;
    };

    if (!body.reviewerRole || !body.targetUserId || !body.rating || !body.feedback?.trim()) {
      return NextResponse.json(
        { error: "reviewerRole, targetUserId, rating, and feedback are required" },
        { status: 400 }
      );
    }

    const review = await submitGatedReview(
      id,
      reviewerId,
      reviewerName,
      body.reviewerRole,
      body.targetUserId,
      body.rating,
      body.feedback.trim()
    );

    return NextResponse.json({ review });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
