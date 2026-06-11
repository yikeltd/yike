import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { listActivePlans } from "@/lib/subscriptions/service";
import { getRevenueOffers } from "@/lib/revenue-pricing/service";
import { PricingPlans } from "@/components/subscriptions/pricing-plans";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: `Plans for Agents & Developers`,
  description: `Compare Yike seller plans — free listings stay available. Upgrade for more slots, analytics, and branding on ${SITE_NAME}.`,
  alternates: { canonical: `${SITE_URL}/pricing` },
};

export default async function PricingPage() {
  const admin = createAdminClient();
  const session = await getSession();
  const plans = admin ? await listActivePlans(admin) : [];
  const offers = admin ? await getRevenueOffers(admin) : { founding_subscription_offer: true };

  return (
    <div className="mx-auto max-w-6xl px-3 py-8 pb-16 lg:px-6">
      <header className="mb-8 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-wide text-gold">Seller plans</p>
        <h1 className="mt-2 text-3xl font-bold text-navy lg:text-4xl">
          Scale when you are ready
        </h1>
        <p className="mt-3 text-sm text-muted lg:text-base">
          Free listings remain. Subscriptions unlock more active slots, business verification, analytics,
          and agency or developer branding — no forced upgrade.
        </p>
        {!session ? (
          <Link
            href="/auth/signup"
            className="mt-4 inline-flex text-sm font-semibold text-navy underline-offset-2 hover:underline"
          >
            Create a free account →
          </Link>
        ) : null}
      </header>

      <PricingPlans
        plans={plans}
        foundingOfferActive={offers.founding_subscription_offer}
        isLoggedIn={Boolean(session)}
      />
    </div>
  );
}
