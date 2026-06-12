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
import { DEFAULT_BILLING_TERMS, listBillingTerms } from "@/lib/subscriptions/billing-terms";

export const runtime = "nodejs";

export async function GET() {
  const admin = tryCreateAdminClient();
  const fallbackPlans = buildFallbackSubscriptionPlans();

  if (!admin) {
    return NextResponse.json({
      plans: fallbackPlans,
      foundingOfferActive: true,
      currentPlanLabel: "Free",
      currentPlanCode: "free",
      billingTerms: DEFAULT_BILLING_TERMS,
    });
  }

  const session = await getSession();
  const [plans, offers, activeSubscription, billingTerms] = await Promise.all([
    listActivePlans(admin),
    getRevenueOffers(admin),
    session ? getActiveUserSubscription(admin, session.id) : Promise.resolve(null),
    listBillingTerms(admin),
  ]);

  const validPlans = (plans.length ? plans : fallbackPlans).filter((plan) =>
    isSubscriptionPlanCode(plan.plan_code)
  );

  const currentPlanCode =
    activeSubscription?.plan && isSubscriptionPlanCode(activeSubscription.plan.plan_code)
      ? activeSubscription.plan.plan_code
      : ("free" as const);
  const currentPlanLabel = getPlanDisplayLabel(currentPlanCode);

  return NextResponse.json({
    plans: validPlans.map((plan) => ({
      plan_code: plan.plan_code,
      monthly_price: plan.monthly_price,
      active_listing_limit: plan.active_listing_limit,
      display: PLAN_DISPLAY[plan.plan_code],
    })),
    foundingOfferActive: offers.founding_subscription_offer,
    currentPlanLabel,
    currentPlanCode,
    billingTerms,
  });
}
