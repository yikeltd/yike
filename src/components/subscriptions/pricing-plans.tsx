"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ChevronRight, Home, Layers, Sparkles } from "lucide-react";
import type { SubscriptionPlanCode } from "@/lib/subscriptions/constants";
import { BillingTermPicker } from "@/components/subscriptions/billing-term-picker";
import type { BillingTerm } from "@/lib/subscriptions/billing-terms.shared";
import {
  DEFAULT_BILLING_TERMS,
  calculateSubscriptionBilling,
} from "@/lib/subscriptions/billing-terms.shared";
import {
  PLAN_CARD_THEME,
  PLAN_DISPLAY,
  formatListingLimit,
  isSubscriptionPlanCode,
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

export function getRolePlanAllocation(
  accountType?: string | null,
  role?: string | null,
): { primary: SubscriptionPlanCode[]; secondary: SubscriptionPlanCode[] } {
  if (accountType === "developer") {
    return {
      primary: ["developer", "agency"],
      secondary: ["pro_agent", "free"],
    };
  }

  if (accountType === "agency" || accountType === "company") {
    return {
      primary: ["agency", "pro_agent", "developer"],
      secondary: ["free"],
    };
  }

  if (
    role === "agent" ||
    role === "agent_verified" ||
    role === "agent_unverified" ||
    accountType === "agent" ||
    accountType === "dealer"
  ) {
    return {
      primary: ["pro_agent", "agency"],
      secondary: ["free", "developer"],
    };
  }

  // Individual Seller / Landlord / Default
  return {
    primary: ["free", "pro_agent"],
    secondary: ["agency", "developer"],
  };
}

export function PricingPlans({
  plans,
  foundingOfferActive,
  isLoggedIn,
  currentPlanCode = null,
  billingTerms = DEFAULT_BILLING_TERMS,
  accountType = null,
  role = null,
}: {
  plans: PlanRow[];
  foundingOfferActive: boolean;
  isLoggedIn: boolean;
  currentPlanCode?: SubscriptionPlanCode | null;
  billingTerms?: BillingTerm[];
  accountType?: string | null;
  role?: string | null;
}) {
  const activeBillingTerms = billingTerms.filter((term) => term.active);
  const defaultBillingMonths = activeBillingTerms[0]?.months ?? 1;

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingMonths, setBillingMonths] = useState(defaultBillingMonths);

  useEffect(() => {
    if (!activeBillingTerms.some((term) => term.months === billingMonths)) {
      setBillingMonths(defaultBillingMonths);
    }
  }, [activeBillingTerms, billingMonths, defaultBillingMonths]);

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
  const allocation = getRolePlanAllocation(accountType, role);

  const planMap = new Map(plans.map((p) => [p.plan_code, p]));
  const primaryPlans = allocation.primary
    .map((code) => planMap.get(code))
    .filter((p): p is PlanRow => Boolean(p));
  const secondaryPlans = allocation.secondary
    .map((code) => planMap.get(code))
    .filter((p): p is PlanRow => Boolean(p));

  function renderPlanCard(plan: PlanRow) {
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
      ? calculateSubscriptionBilling(plan.monthly_price, billingMonths, billingTerms)
      : null;

    return (
      <article
        key={plan.plan_code}
        className={cn(
          "relative flex flex-col overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md",
          theme.card,
          plan.plan_code === "pro_agent" && "xl:z-10 border-gold/40 ring-1 ring-gold/30",
          isCurrent && "border-emerald-500/50 bg-emerald-50/20 ring-1 ring-emerald-500/30"
        )}
      >
        {isCurrent ? (
          <span className="absolute right-4 top-4 z-10 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            Current Plan
          </span>
        ) : null}

        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              plan.plan_code === "free" && "bg-navy/5 text-navy",
              plan.plan_code === "pro_agent" && "bg-gold/20 text-gold-dark",
              plan.plan_code === "agency" && "bg-navy/10 text-navy",
              plan.plan_code === "developer" && "bg-gold/30 text-navy"
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy">{display.label}</h2>
            <p className="text-xs font-medium text-navy/60">{theme.audience}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-1 flex-col justify-between">
          <div>
            <div className="mb-2">
              {isFree ? (
                <p className="text-3xl font-black tabular-nums text-navy">Free</p>
              ) : billing && billingMonths > 1 ? (
                <div>
                  <p className="text-3xl font-black tabular-nums text-navy">
                    {formatPrice(billing.total, "total", "rent")}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-emerald-700">
                    Save {formatPrice(billing.savings, "total", "rent")} ({billingMonths} months)
                  </p>
                </div>
              ) : (
                <p className="text-3xl font-black tabular-nums text-navy">
                  {formatPrice(plan.monthly_price, "total", "rent")}
                  <span className="text-xs font-medium text-navy/60"> / month</span>
                </p>
              )}
            </div>

            <p className="text-xs font-bold text-navy/80 underline decoration-gold/50 underline-offset-4">
              {limitLabel} Active Listings
            </p>

            <ul className="mt-5 space-y-2.5 border-t border-navy/10 pt-4 text-xs font-medium text-navy/85">
              {display.highlights.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="shrink-0 font-bold text-emerald-600">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            {isFree ? (
              <Link
                href={isLoggedIn ? "/agent/listings/new" : "/auth/signup"}
                prefetch
                className={cn(
                  "pressable flex w-full items-center justify-center rounded-full px-4 py-2.5 text-xs font-bold transition-all",
                  isCurrent
                    ? "pointer-events-none cursor-default bg-navy/5 text-navy/50"
                    : "bg-navy text-white hover:bg-navy/90"
                )}
              >
                {isCurrent ? "Current Plan" : "Choose Plan"}
              </Link>
            ) : isLoggedIn ? (
              <button
                type="button"
                disabled={busy === plan.plan_code || isCurrent}
                onClick={() => void checkout(plan.plan_code)}
                className={cn(
                  "pressable w-full rounded-full px-4 py-2.5 text-xs font-bold transition-all disabled:opacity-60",
                  isCurrent
                    ? "cursor-default bg-navy/5 text-navy/50"
                    : "bg-gold text-navy shadow-sm hover:bg-gold-light"
                )}
              >
                {isCurrent
                  ? "Current Plan"
                  : busy === plan.plan_code
                    ? "Starting…"
                    : "Upgrade"}
              </button>
            ) : (
              <Link
                href="/auth/signup?next=/agent/plans"
                className="pressable flex w-full items-center justify-center rounded-full bg-gold px-4 py-2.5 text-xs font-bold text-navy shadow-sm"
              >
                Sign in to upgrade
              </Link>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {paidPlans.length > 0 && activeBillingTerms.length > 0 ? (
        <BillingTermPicker
          terms={billingTerms}
          value={billingMonths}
          onChange={setBillingMonths}
        />
      ) : null}

      {/* Primary Recommended Plans Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:items-stretch">
        {primaryPlans.map(renderPlanCard)}
      </div>

      {/* Secondary Plans Collapsible */}
      {secondaryPlans.length > 0 ? (
        <details className="group space-y-4 pt-2">
          <summary className="pressable flex cursor-pointer list-none items-center justify-between rounded-2xl border border-navy/10 bg-white px-5 py-3 text-sm font-bold text-navy hover:bg-navy/5">
            <span>More Plans</span>
            <ChevronRight className="h-4 w-4 text-navy/40 transition-transform duration-200 group-open:rotate-90" />
          </summary>
          <div className="pt-2">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {secondaryPlans.map(renderPlanCard)}
            </div>
          </div>
        </details>
      ) : null}
    </div>
  );
}
