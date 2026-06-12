import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { listActivePlans } from "@/lib/subscriptions/service";
import { getRevenueOffers } from "@/lib/revenue-pricing/service";
import { PricingPlans } from "@/components/subscriptions/pricing-plans";

export default async function AgentPlansPage() {
  await requireAuth("/auth/login?next=/agent/plans");
  const admin = createAdminClient();
  const plans = admin ? await listActivePlans(admin) : [];
  const offers = admin
    ? await getRevenueOffers(admin)
    : { founding_subscription_offer: true };

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
      </div>

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
