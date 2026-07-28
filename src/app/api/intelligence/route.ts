import { NextResponse } from "next/server";
import {
  getBuyerRecommendationsForUser,
  getSellerIntelligenceSnapshot,
  getTrustGrowthPlanForUser,
} from "@/lib/intelligence/service";

export const runtime = "nodejs";

/**
 * GET /api/intelligence?role=buyer|seller|trust&userId=xxx
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") || "seller";
  const userId = searchParams.get("userId") || "user_sample";

  try {
    if (role === "buyer") {
      const recommendations = await getBuyerRecommendationsForUser(userId);
      return NextResponse.json({ ok: true, role, recommendations });
    }

    if (role === "trust") {
      const growthPlan = await getTrustGrowthPlanForUser(userId);
      return NextResponse.json({ ok: true, role, growthPlan });
    }

    const snapshot = await getSellerIntelligenceSnapshot(userId);
    return NextResponse.json({ ok: true, role, snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Intelligence lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
