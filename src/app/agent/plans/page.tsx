import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { listActivePlans, getActiveUserSubscription } from "@/lib/subscriptions/service";
import { getRevenueOffers } from "@/lib/revenue-pricing/service";
import { PricingPlans } from "@/components/subscriptions/pricing-plans";
import { PLAN_DISPLAY } from "@/lib/subscriptions/constants";

export default async function AgentPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const user = await requireAuth("/auth/login?next=/agent/plans");
  const { upgraded } = await searchParams;
  const admin = createAdminClient();
  const [plans, offers, activeSubscription] = await Promise.all([
    admin ? listActivePlans(admin) : Promise.resolve([]),
    admin
      ? getRevenueOffers(admin)
      : Promise.resolve({ founding_subscription_offer: true }),
    admin ? getActiveUserSubscription(admin, user.id) : Promise.resolve(null),
  ]);

  const currentPlanLabel = activeSubscription?.plan
    ? PLAN_DISPLAY[activeSubscription.plan.plan_code].label
    : "Free";

  return (
    <div className="mx-auto max-w-6xl space-y-6 pt-4 pb-8">
      <div>
        <Link href="/agent" className="text-xs font-semibold text-gold-dark hover:underline">
          ← Back to profile
        </Link>
        <h1 className="mt-2 text-xl font-bold text-navy">Plans & upgrades</h1>
        <p className="mt-1 text-sm text-muted">
          More active listings, analytics, and branding — upgrade only when you need to scale.
        </p>
        <p className="mt-2 text-xs font-semibold text-navy">
          Current plan: {currentPlanLabel}
        </p>
      </div>

      {upgraded === "1" ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Upgrade complete. Your new plan benefits are now active.
        </p>
      ) : null}

      {plans.length === 0 ? (
        <p className="rounded-2xl border border-border bg-elevated px-4 py-6 text-sm text-muted">
          Plans are loading unavailable right now. Try again in a moment or contact support on
          WhatsApp.
        </p>
      ) : (
        <PricingPlans
          plans={plans}
          foundingOfferActive={offers.founding_subscription_offer}
          isLoggedIn
        />
      )}
    </div>
  );
}
