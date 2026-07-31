"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";

export function SubscriptionPlansManager() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const plans = [
    {
      id: "starter",
      name: "Starter Merchant",
      priceMonthly: 0,
      priceAnnual: 0,
      description: "For individual sellers listing up to 3 properties or vehicles.",
      features: [
        "Up to 3 Active Listings",
        "Standard Search Placement",
        "Direct Buyer WhatsApp Forwarding",
        "Basic Trust Badge (NIN Verified)",
      ],
      popular: false,
      cta: "Current Free Tier",
      href: "/post-property",
    },
    {
      id: "pro",
      name: "Pro Merchant",
      priceMonthly: 25000,
      priceAnnual: 240000,
      description: "For active agents and dealers seeking high volume leads and escrow custody.",
      features: [
        "Up to 25 Active Listings",
        "2 Free Monthly Featured Boosts",
        "50% Discount on Escrow Payout Fees",
        "AI Lead Quality Scoring (Hot/Warm/Cold)",
        "Gold Merchant Badge (+20 Trust Pts)",
      ],
      popular: true,
      cta: "Upgrade to Pro",
      href: "/payments/checkout?plan=pro",
    },
    {
      id: "enterprise",
      name: "Enterprise Agency",
      priceMonthly: 75000,
      priceAnnual: 720000,
      description: "For real estate agencies and automotive showrooms managing large portfolios.",
      features: [
        "Unlimited Active Listings",
        "10 Free Monthly Featured Boosts",
        "Dedicated Escrow Officer Concierge",
        "Full Seller CRM & Analytics Export",
        "Platinum Merchant Badge (+35 Trust Pts)",
      ],
      popular: false,
      cta: "Subscribe Enterprise",
      href: "/payments/checkout?plan=enterprise",
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white py-12 px-4 sm:px-6 select-none">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* TITLE */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="rounded-full bg-gold/20 text-navy dark:text-gold px-3.5 py-1 text-xs font-black uppercase tracking-wider">
            Yike Merchant Subscription Plans
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-navy dark:text-white tracking-tight">
            Scale Your Real Estate & Automotive Business
          </h1>
          <p className="text-xs sm:text-sm text-navy/70 dark:text-white/70">
            Choose a plan to unlock higher listing limits, escrow fee discounts, AI lead insights, and verified trust badges.
          </p>

          {/* BILLING TOGGLE */}
          <div className="pt-2 flex items-center justify-center gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "px-4 py-2 rounded-2xl transition-all",
                billingCycle === "monthly"
                  ? "bg-[#031B4E] text-gold font-black shadow-md"
                  : "bg-white dark:bg-white/10 text-navy dark:text-white"
              )}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annual")}
              className={cn(
                "px-4 py-2 rounded-2xl transition-all flex items-center gap-1.5",
                billingCycle === "annual"
                  ? "bg-[#031B4E] text-gold font-black shadow-md"
                  : "bg-white dark:bg-white/10 text-navy dark:text-white"
              )}
            >
              <span>Annual Billing</span>
              <span className="rounded-full bg-emerald-500 text-white px-2 py-0.5 text-[9px] font-black uppercase">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* PLAN CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => {
            const price = billingCycle === "annual" ? plan.priceAnnual / 12 : plan.priceMonthly;

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-3xl p-6 flex flex-col justify-between transition-all space-y-6",
                  plan.popular
                    ? "bg-[#031B4E] text-white shadow-2xl border-2 border-gold"
                    : "bg-white dark:bg-navy text-navy dark:text-white border border-slate-200 dark:border-white/10 shadow-lg"
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold text-navy px-3.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Most Popular Choice
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-black">{plan.name}</h3>
                    <p className={cn("text-xs mt-1", plan.popular ? "text-white/80" : "text-navy/70 dark:text-white/70")}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black">{price === 0 ? "Free" : formatPrice(price)}</span>
                    {price > 0 && <span className={cn("text-xs", plan.popular ? "text-white/70" : "text-navy/50 dark:text-white/50")}>/ month</span>}
                  </div>

                  <ul className="space-y-2.5 text-xs font-semibold border-t border-slate-200 dark:border-white/10 pt-4">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className={cn("h-4 w-4 shrink-0 mt-0.5", plan.popular ? "text-gold" : "text-emerald-600")} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={plan.href}
                  className={cn(
                    "pressable w-full py-3 rounded-2xl text-xs font-black uppercase text-center tracking-wider transition-all flex items-center justify-center gap-1.5",
                    plan.popular
                      ? "bg-gold text-navy hover:bg-gold-light shadow-md"
                      : "bg-[#031B4E] dark:bg-gold text-white dark:text-navy hover:opacity-90"
                  )}
                >
                  <span>{plan.cta}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
