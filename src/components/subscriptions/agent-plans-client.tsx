"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  currentPlanLabel?: string;
  error?: string;
};

export function AgentPlansClient() {
  const searchParams = useSearchParams();
  const upgraded = searchParams.get("upgraded") === "1";
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [foundingOfferActive, setFoundingOfferActive] = useState(true);
  const [currentPlanLabel, setCurrentPlanLabel] = useState("Free");

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
        setCurrentPlanLabel(data.currentPlanLabel ?? "Free");
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
          Current plan: {loading ? "…" : currentPlanLabel}
        </p>
      </div>

      {upgraded ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Upgrade complete. Your new plan benefits are now active.
        </p>
      ) : null}

      {loading ? (
        <p className="rounded-2xl border border-border bg-elevated px-4 py-6 text-sm text-muted">
          Loading plans…
        </p>
      ) : loadError ? (
        <div className="space-y-3 rounded-2xl border border-border bg-elevated px-4 py-6 text-sm text-muted">
          <p>Plans are unavailable right now. Try again in a moment or contact support on WhatsApp.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-xs font-bold text-navy underline"
          >
            Reload plans
          </button>
        </div>
      ) : (
        <PricingPlans
          plans={plans}
          foundingOfferActive={foundingOfferActive}
          isLoggedIn
        />
      )}
    </div>
  );
}
