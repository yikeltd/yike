"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Home, Layers, Sparkles } from "lucide-react";
import type { SubscriptionPlanCode } from "@/lib/subscriptions/constants";
import { BillingTermPicker } from "@/components/subscriptions/billing-term-picker";
import {
  PLAN_CARD_THEME,
  PLAN_DISPLAY,
  calculateSubscriptionBilling,
  formatListingLimit,
  isSubscriptionPlanCode,
  type SubscriptionBillingMonths,
} from "@/lib/subscriptions/constants";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

type PlanRow = {
  plan_code: SubscriptionPlanCode;
  monthly_price: number;
  active_listing_limit: number | null;
};

const PLAN_ICONS: Record<SubscriptionPlanCode, typeof Home> = {
  free: Home,
  pro_agent: Sparkles,
  agency: Building2,
  developer: Layers,
};

export function PricingPlans({
  plans,
  foundingOfferActive,
  isLoggedIn,
  currentPlanCode = null,
}: {
  plans: PlanRow[];
  foundingOfferActive: boolean;
  isLoggedIn: boolean;
  currentPlanCode?: SubscriptionPlanCode | null;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingMonths, setBillingMonths] = useState<SubscriptionBillingMonths>(1);

  async function checkout(planCode: SubscriptionPlanCode) {
    if (planCode === "free") return;
    setBusy(planCode);
    setError(null);

    const res = await fetch("/api/subscriptions/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planCode, billingMonths }),
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

      {paidPlans.length > 0 ? (
        <BillingTermPicker value={billingMonths} onChange={setBillingMonths} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:items-stretch">
        {plans.map((plan) => {
          if (!isSubscriptionPlanCode(plan.plan_code)) return null;
          const display = PLAN_DISPLAY[plan.plan_code];
          const theme = PLAN_CARD_THEME[plan.plan_code];
          const Icon = PLAN_ICONS[plan.plan_code];
          const isFree = plan.plan_code === "free";
          const isCurrent = currentPlanCode === plan.plan_code;
          const limitLabel =
            plan.active_listing_limit != null
              ? formatListingLimit(plan.active_listing_limit)
              : "∞";
          const billing = !isFree
            ? calculateSubscriptionBilling(plan.monthly_price, billingMonths)
            : null;

          return (
            <article
              key={plan.plan_code}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-2xl border",
                theme.card,
                plan.plan_code === "pro_agent" && "xl:z-10"
              )}
            >
              {isCurrent ? (
                <span className="absolute left-3 top-3 z-10 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                  Your plan
                </span>
              ) : null}

              <div className={cn("px-4 pb-3 pt-4", theme.header)}>
                <div className="flex items-start justify-between gap-2 pr-16">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      plan.plan_code === "free" && "bg-white text-slate-600",
                      plan.plan_code === "pro_agent" && "bg-gold/30 text-gold-dark",
                      plan.plan_code === "agency" && "bg-white/15 text-gold",
                      plan.plan_code === "developer" && "bg-gold/20 text-gold"
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  {theme.badge ? (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        plan.plan_code === "pro_agent" && "bg-gold text-navy",
                        plan.plan_code === "agency" && "bg-gold text-navy",
                        plan.plan_code === "developer" && "bg-gold/90 text-navy",
                        plan.plan_code === "free" && "bg-white text-muted"
                      )}
                    >
                      {theme.badge}
                    </span>
                  ) : null}
                </div>
                <h2 className={cn("mt-3 text-lg font-bold", theme.headerText)}>{display.label}</h2>
                <p className={cn("mt-0.5 text-xs", theme.headerMuted)}>{theme.audience}</p>
              </div>

              <div className="flex flex-1 flex-col p-4 pt-3">
                <div className="mb-3 flex items-baseline gap-1.5">
                  <span className={cn("text-3xl font-bold tabular-nums", theme.listingStat)}>
                    {limitLabel}
                  </span>
                  <span className="text-xs font-medium text-muted">active listings</span>
                </div>

                {isFree ? (
                  <p className="text-2xl font-bold text-navy tabular-nums">₦0</p>
                ) : billing && billingMonths > 1 ? (
                  <div className="space-y-1">
                    <p className="text-xs text-muted line-through tabular-nums">
                      {formatPrice(billing.subtotal, "total", "rent")} list
                    </p>
                    <p className="text-2xl font-bold text-navy tabular-nums">
                      {formatPrice(billing.total, "total", "rent")}
                      <span className="text-sm font-medium text-muted">
                        {" "}
                        / {billingMonths} mo
                      </span>
                    </p>
                    <p className="text-[11px] font-semibold text-gold-dark">
                      Save {formatPrice(billing.savings, "total", "rent")} ·{" "}
                      {formatPrice(billing.effectiveMonthly, "total", "rent")}/mo effective
                    </p>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-navy tabular-nums">
                    {formatPrice(plan.monthly_price, "total", "rent")}
                    <span className="text-sm font-medium text-muted"> / mo</span>
                  </p>
                )}
                <p className="mt-0.5 text-[11px] text-muted">{display.tagline}</p>

                <ul className="mt-4 flex-1 space-y-2 border-t border-border/60 pt-4 text-sm text-navy/90">
                  {display.highlights.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className={cn("shrink-0 font-bold", theme.check)}>✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5">
                  {isFree ? (
                    <Link
                      href={isLoggedIn ? "/agent/listings/new" : "/auth/signup"}
                      prefetch
                      className={cn(
                        "pressable flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold",
                        isCurrent ? theme.ctaMuted : theme.cta
                      )}
                    >
                      {isLoggedIn ? (isCurrent ? "Current plan" : "Continue free") : "Sign up free"}
                    </Link>
                  ) : isLoggedIn ? (
                    <button
                      type="button"
                      disabled={busy === plan.plan_code || isCurrent}
                      onClick={() => void checkout(plan.plan_code)}
                      className={cn(
                        "pressable w-full rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-60",
                        isCurrent ? theme.ctaMuted : theme.cta
                      )}
                    >
                      {isCurrent
                        ? "Current plan"
                        : busy === plan.plan_code
                          ? "Starting…"
                          : billingMonths > 1
                            ? `Pay ${billing?.total ? formatPrice(billing.total, "total", "rent") : ""} · ${billingMonths} mo`
                            : `Upgrade to ${display.label}`}
                    </button>
                  ) : (
                    <Link
                      href="/auth/signup?next=/agent/plans"
                      className={cn(
                        "pressable flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold",
                        theme.cta
                      )}
                    >
                      Sign in to upgrade
                    </Link>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted">
        Free listings always available. Longer billing saves more — no auto-renewal; you choose when to
        pay again.
      </p>

      {paidPlans.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-gold/30 bg-gold/5 px-3 py-2.5 text-center text-xs text-navy">
            <span className="font-bold text-gold-dark">Pro Agent</span>
            <p className="mt-0.5 text-muted">Solo agents</p>
          </div>
          <div className="rounded-xl border border-navy/20 bg-navy/5 px-3 py-2.5 text-center text-xs text-navy">
            <span className="font-bold">Agency</span>
            <p className="mt-0.5 text-muted">Teams & brands</p>
          </div>
          <div className="rounded-xl border border-navy/20 bg-gradient-to-r from-navy/5 to-gold/10 px-3 py-2.5 text-center text-xs text-navy">
            <span className="font-bold">Developer</span>
            <p className="mt-0.5 text-muted">Project showcases</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
