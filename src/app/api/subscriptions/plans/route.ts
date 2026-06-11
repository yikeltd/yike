import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listActivePlans } from "@/lib/subscriptions/service";
import { PLAN_DISPLAY } from "@/lib/subscriptions/constants";
import { getRevenueOffers } from "@/lib/revenue-pricing/service";

export const runtime = "nodejs";

export async function GET() {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const [plans, offers] = await Promise.all([
    listActivePlans(admin),
    getRevenueOffers(admin),
  ]);
  return NextResponse.json({
    plans: plans.map((plan) => ({
      ...plan,
      display: PLAN_DISPLAY[plan.plan_code],
    })),
    foundingOfferActive: offers.founding_subscription_offer,
  });
}
