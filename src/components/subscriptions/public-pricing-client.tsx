"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DEFAULT_BILLING_TERMS,
  type BillingTerm,
} from "@/lib/subscriptions/billing-terms.shared";
import {
  isSubscriptionPlanCode,
  type SubscriptionPlanCode,
} from "@/lib/subscriptions/constants";
import { PricingPlans } from "@/components/subscriptions/pricing-plans";

type PlanRow = {
  plan_code: SubscriptionPlanCode;
  monthly_price: number;
  active_listing_limit: number | null;
};

type PlansPayload = {
  plans?: PlanRow[];
  foundingOfferActive?: boolean;
  currentPlanCode?: SubscriptionPlanCode;
  billingTerms?: BillingTerm[];
};

export function PublicPricingClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [foundingOfferActive, setFoundingOfferActive] = useState(true);
  const [currentPlanCode, setCurrentPlanCode] = useState<SubscriptionPlanCode | null>(null);
  const [billingTerms, setBillingTerms] = useState<BillingTerm[]>(DEFAULT_BILLING_TERMS);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/subscriptions/plans", { cache: "no-store" });
        const data = (await res.json()) as PlansPayload;
        if (cancelled) return;

        const rows = (data.plans ?? []).filter(
          (plan): plan is PlanRow =>
            Boolean(plan?.plan_code) &&
            isSubscriptionPlanCode(plan.plan_code) &&
            typeof plan.monthly_price === "number"
        );

        if (!rows.length) {
          setLoadError(true);
          return;
        }

        setPlans(rows);
        setFoundingOfferActive(data.foundingOfferActive ?? true);
        setCurrentPlanCode(
          data.currentPlanCode && isSubscriptionPlanCode(data.currentPlanCode)
            ? data.currentPlanCode
            : isLoggedIn
              ? "free"
              : null
        );
        setBillingTerms(
          data.billingTerms?.length ? data.billingTerms : DEFAULT_BILLING_TERMS
        );
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  if (loading) {
    return (
      <p className="rounded-2xl border border-border bg-elevated px-4 py-10 text-center text-sm text-muted">
        Loading current prices…
      </p>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-3 rounded-2xl border border-border bg-elevated px-4 py-8 text-center text-sm text-muted">
        <p>Prices are unavailable right now. Try again shortly or email hello@yike.ng.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-xs font-bold text-navy underline"
        >
          Reload
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isLoggedIn ? (
        <p className="rounded-xl border border-navy/10 bg-navy/5 px-4 py-3 text-sm text-navy">
          You&apos;re signed in.{" "}
          <Link href="/agent/plans" className="font-semibold text-gold-dark underline">
            Open your plans page
          </Link>{" "}
          to upgrade with checkout.
        </p>
      ) : null}

      <PricingPlans
        plans={plans}
        foundingOfferActive={foundingOfferActive}
        isLoggedIn={isLoggedIn}
        currentPlanCode={currentPlanCode}
        billingTerms={billingTerms}
      />
    </div>
  );
}
