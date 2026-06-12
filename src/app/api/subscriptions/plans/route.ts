import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { getActiveUserSubscription, listActivePlans } from "@/lib/subscriptions/service";
import {
  PLAN_DISPLAY,
  buildFallbackSubscriptionPlans,
  getPlanDisplayLabel,
  isSubscriptionPlanCode,
} from "@/lib/subscriptions/constants";
import { getRevenueOffers } from "@/lib/revenue-pricing/service";

export const runtime = "nodejs";

export async function GET() {
  const admin = tryCreateAdminClient();
  const fallbackPlans = buildFallbackSubscriptionPlans();

  if (!admin) {
    return NextResponse.json({
      plans: fallbackPlans,
      foundingOfferActive: true,
      currentPlanLabel: "Free",
    });
  }

  const session = await getSession();
  const [plans, offers, activeSubscription] = await Promise.all([
    listActivePlans(admin),
    getRevenueOffers(admin),
    session ? getActiveUserSubscription(admin, session.id) : Promise.resolve(null),
  ]);

  const validPlans = (plans.length ? plans : fallbackPlans).filter((plan) =>
    isSubscriptionPlanCode(plan.plan_code)
  );

  const currentPlanLabel = activeSubscription?.plan
    ? getPlanDisplayLabel(activeSubscription.plan.plan_code)
    : "Free";

  return NextResponse.json({
    plans: validPlans.map((plan) => ({
      plan_code: plan.plan_code,
      monthly_price: plan.monthly_price,
      active_listing_limit: plan.active_listing_limit,
      display: PLAN_DISPLAY[plan.plan_code],
    })),
    foundingOfferActive: offers.founding_subscription_offer,
    currentPlanLabel,
  });
}
