"use client";

import { useState } from "react";
import Link from "next/link";
import type { SubscriptionPlanCode } from "@/lib/subscriptions/constants";
import { PLAN_DISPLAY } from "@/lib/subscriptions/constants";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

type PlanRow = {
  plan_code: SubscriptionPlanCode;
  monthly_price: number;
  active_listing_limit: number | null;
};

export function PricingPlans({
  plans,
  foundingOfferActive,
  isLoggedIn,
}: {
  plans: PlanRow[];
  foundingOfferActive: boolean;
  isLoggedIn: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(planCode: SubscriptionPlanCode) {
    if (planCode === "free") return;
    setBusy(planCode);
    setError(null);

    const res = await fetch("/api/subscriptions/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planCode }),
    });
    const data = (await res.json()) as { authorizationUrl?: string; error?: string };
    setBusy(null);

    if (!res.ok) {
      setError(data.error ?? "Could not start checkout");
      return;
    }
    if (data.authorizationUrl) {
      window.location.assign(data.authorizationUrl);
    } else {
      window.location.assign("/agent/plans?upgraded=1");
    }
  }

  const paidPlans = plans.filter((p) => p.plan_code !== "free");

  return (
    <div className="space-y-6">
      {foundingOfferActive ? (
        <p className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-navy">
          Founding offer: launch pricing locked for early subscribers. Manual renewal each month — no
          auto-charge.
        </p>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const display = PLAN_DISPLAY[plan.plan_code];
          const isFree = plan.plan_code === "free";
          const highlighted = plan.plan_code === "pro_agent";

          return (
            <article
              key={plan.plan_code}
              className={cn(
                "flex flex-col rounded-2xl border bg-white p-5 shadow-sm",
                highlighted ? "border-gold ring-1 ring-gold/40" : "border-border"
              )}
            >
              <h2 className="text-lg font-bold text-navy">{display.label}</h2>
              <p className="mt-1 text-xs text-muted">{display.tagline}</p>
              <p className="mt-4 text-2xl font-bold text-navy tabular-nums">
                {isFree ? "₦0" : formatPrice(plan.monthly_price, "total", "rent")}
                {!isFree ? <span className="text-sm font-medium text-muted"> / month</span> : null}
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-navy/90">
                {display.highlights.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-gold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                {isFree ? (
                  <Link
                    href={isLoggedIn ? "/agent/listings/new" : "/auth/signup"}
                    prefetch
                    className="pressable flex w-full items-center justify-center rounded-xl bg-surface px-4 py-2.5 text-sm font-bold text-navy"
                  >
                    {isLoggedIn ? "Continue free" : "Sign up free"}
                  </Link>
                ) : isLoggedIn ? (
                  <button
                    type="button"
                    disabled={busy === plan.plan_code}
                    onClick={() => void checkout(plan.plan_code)}
                    className="pressable w-full rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-navy disabled:opacity-60"
                  >
                    {busy === plan.plan_code ? "Starting…" : `Upgrade to ${display.label}`}
                  </button>
                ) : (
                  <Link
                    href={`/auth/signup?next=/pricing`}
                    className="pressable flex w-full items-center justify-center rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-navy"
                  >
                    Sign in to upgrade
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted">
        Free listings always available. Upgrade only when you need more scale — renew manually each month.
      </p>

      {paidPlans.length > 0 ? (
        <div className="rounded-xl border border-border bg-surface/50 px-4 py-3 text-xs text-muted">
          Compare: Pro Agent for independents · Agency for teams · Developer for project showcases.
        </div>
      ) : null}
    </div>
  );
}
