"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Crown,
  Building2,
  Gem,
  Check,
  ShieldCheck,
  ArrowRight,
  X,
  CreditCard,
  Lock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type BillingCycle = 1 | 3 | 6 | 12;

type Plan = {
  id: "core" | "pro" | "elite" | "prime";
  name: string;
  subtitle: string;
  monthlyBasePrice: number;
  listingsBadge: string;
  features: string[];
  popularBadge?: string;
  premiumBadge?: string;
  theme: "green" | "gold" | "purple" | "navy";
  ctaText: string;
  current?: boolean;
};

const PLANS: Plan[] = [
  {
    id: "core",
    name: "Core",
    subtitle: "Individuals",
    monthlyBasePrice: 0,
    listingsBadge: "5 Active Listings",
    features: ["Basic verification", "Basic insights", "Standard review"],
    theme: "green",
    ctaText: "Current Plan",
    current: true,
  },
  {
    id: "pro",
    name: "Pro",
    subtitle: "Dealers & Agents",
    monthlyBasePrice: 9999,
    listingsBadge: "30 Active Listings",
    popularBadge: "MOST POPULAR",
    features: [
      "Verified Business",
      "Business profile",
      "Advanced analytics",
      "Priority review",
      "10% off featured & boost",
    ],
    theme: "gold",
    ctaText: "Choose Pro",
  },
  {
    id: "elite",
    name: "Elite",
    subtitle: "Agencies",
    monthlyBasePrice: 24999,
    listingsBadge: "100 Active Listings",
    features: [
      "Agency profile",
      "Team members",
      "Lead management",
      "Priority support",
      "Advanced analytics",
      "15% off featured & boost",
    ],
    theme: "purple",
    ctaText: "Choose Elite",
  },
  {
    id: "prime",
    name: "Prime",
    subtitle: "Enterprise Networks",
    monthlyBasePrice: 49999,
    listingsBadge: "Unlimited Listings",
    premiumBadge: "PREMIUM",
    features: [
      "Unlimited listings",
      "Multiple branches",
      "Premium brand profile",
      "Homepage feature eligibility",
      "Highest search priority",
      "Dedicated account manager",
      "Early access to new features",
      "20% off featured & boost",
    ],
    theme: "navy",
    ctaText: "Choose Prime",
  },
];

export function SellerPlansView() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(1);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<Plan | null>(null);
  const [compareSheetOpen, setCompareSheetOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  // Discount Multipliers per billing cycle
  const discountPct = billingCycle === 3 ? 10 : billingCycle === 6 ? 20 : billingCycle === 12 ? 30 : 0;
  const multiplier = (100 - discountPct) / 100;

  function getCalculatedPrice(baseMonthly: number): { monthly: number; total: number } {
    if (baseMonthly === 0) return { monthly: 0, total: 0 };
    const monthlyFormatted = Math.round(baseMonthly * multiplier);
    const total = monthlyFormatted * billingCycle;
    return { monthly: monthlyFormatted, total };
  }

  function handleChoosePlan(plan: Plan) {
    if (plan.current) return;
    setSelectedPlanForCheckout(plan);
  }

  async function handleConfirmPayment() {
    setPaying(true);
    try {
      // Simulate Paystack / Flutterwave instant checkout link
      window.setTimeout(() => {
        setPaying(false);
        setSelectedPlanForCheckout(null);
        alert(`Payment successful! Your account has been upgraded to ${selectedPlanForCheckout?.name}.`);
        router.push("/agent");
      }, 1500);
    } catch {
      setPaying(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#f8fafc] text-navy pb-24 select-none">
      <div className="mx-auto max-w-2xl px-3.5 pt-4 space-y-4">
        {/* PAGE TITLE */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-navy">
            Seller plans
          </h1>
        </div>

        {/* BILLING SELECTOR TABS */}
        <div className="grid grid-cols-4 gap-1 rounded-2xl bg-slate-200/70 p-1 border border-slate-300/60 shadow-inner">
          <button
            type="button"
            onClick={() => setBillingCycle(1)}
            className={cn(
              "flex flex-col items-center justify-center py-2 rounded-xl text-xs font-black transition-all",
              billingCycle === 1
                ? "bg-white text-navy shadow-sm ring-1 ring-black/5"
                : "text-navy/60 hover:text-navy"
            )}
          >
            <span>Monthly</span>
          </button>

          <button
            type="button"
            onClick={() => setBillingCycle(3)}
            className={cn(
              "flex flex-col items-center justify-center py-1.5 rounded-xl text-xs font-black transition-all",
              billingCycle === 3
                ? "bg-white text-navy shadow-sm ring-1 ring-black/5"
                : "text-navy/60 hover:text-navy"
            )}
          >
            <span>3 Months</span>
            <span className="text-[9px] font-extrabold text-emerald-600">Save 10%</span>
          </button>

          <button
            type="button"
            onClick={() => setBillingCycle(6)}
            className={cn(
              "flex flex-col items-center justify-center py-1.5 rounded-xl text-xs font-black transition-all",
              billingCycle === 6
                ? "bg-white text-navy shadow-sm ring-1 ring-black/5"
                : "text-navy/60 hover:text-navy"
            )}
          >
            <span>6 Months</span>
            <span className="text-[9px] font-extrabold text-emerald-600">Save 20%</span>
          </button>

          <button
            type="button"
            onClick={() => setBillingCycle(12)}
            className={cn(
              "flex flex-col items-center justify-center py-1.5 rounded-xl text-xs font-black transition-all",
              billingCycle === 12
                ? "bg-white text-navy shadow-sm ring-1 ring-black/5"
                : "text-navy/60 hover:text-navy"
            )}
          >
            <span>12 Months</span>
            <span className="text-[9px] font-extrabold text-emerald-600">Save 30%</span>
          </button>
        </div>

        {/* PLAN CARDS STACK */}
        <div className="space-y-4">
          {PLANS.map((plan) => {
            const { monthly } = getCalculatedPrice(plan.monthlyBasePrice);
            const isNavyTheme = plan.theme === "navy";

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative overflow-hidden rounded-3xl p-5 shadow-xl transition-all border-2",
                  plan.theme === "green" && "border-emerald-300 bg-white text-navy",
                  plan.theme === "gold" && "border-gold bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 text-navy ring-2 ring-gold/20",
                  plan.theme === "purple" && "border-purple-300 bg-gradient-to-br from-purple-50/50 via-white to-purple-50/20 text-navy",
                  plan.theme === "navy" && "border-navy bg-[#031B4E] text-white shadow-2xl"
                )}
              >
                {/* POPULAR OR PREMIUM BADGE */}
                {plan.popularBadge && (
                  <div className="absolute top-0 right-0 rounded-bl-2xl bg-gold px-3 py-1 text-[10px] font-black uppercase text-navy shadow-xs flex items-center gap-1">
                    <span>★</span>
                    <span>{plan.popularBadge}</span>
                  </div>
                )}
                {plan.premiumBadge && (
                  <div className="absolute top-3 right-3 rounded-full border border-gold/40 bg-gold/20 px-3 py-0.5 text-[10px] font-black uppercase text-gold backdrop-blur-md flex items-center gap-1">
                    <span>💎</span>
                    <span>{plan.premiumBadge}</span>
                  </div>
                )}

                <div className="grid grid-cols-12 gap-3 items-start">
                  {/* LEFT DETAILS */}
                  <div className="col-span-6 space-y-2">
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-2xl border shadow-xs",
                        plan.theme === "green" && "bg-emerald-100 border-emerald-200 text-emerald-800",
                        plan.theme === "gold" && "bg-amber-100 border-amber-200 text-amber-900",
                        plan.theme === "purple" && "bg-purple-100 border-purple-200 text-purple-900",
                        plan.theme === "navy" && "bg-white/10 border-white/20 text-gold"
                      )}
                    >
                      {plan.id === "core" && <User className="h-5 w-5" />}
                      {plan.id === "pro" && <Crown className="h-5 w-5" />}
                      {plan.id === "elite" && <Building2 className="h-5 w-5" />}
                      {plan.id === "prime" && <Gem className="h-5 w-5" />}
                    </div>

                    <div>
                      <h2 className="text-xl font-black tracking-tight">{plan.name}</h2>
                      <p
                        className={cn(
                          "text-xs font-semibold",
                          isNavyTheme ? "text-white/60" : "text-navy/60"
                        )}
                      >
                        {plan.subtitle}
                      </p>
                    </div>

                    {/* Price */}
                    <div>
                      <p className="text-2xl font-black tracking-tight">
                        {plan.monthlyBasePrice === 0
                          ? "₦0"
                          : `₦${monthly.toLocaleString()}`}
                      </p>
                      {plan.monthlyBasePrice > 0 && (
                        <span
                          className={cn(
                            "text-[10px] font-bold block",
                            isNavyTheme ? "text-white/60" : "text-navy/50"
                          )}
                        >
                          / month
                        </span>
                      )}
                    </div>

                    {/* CTA Button */}
                    <div className="pt-2">
                      {plan.current ? (
                        <button
                          type="button"
                          disabled
                          className="rounded-xl bg-emerald-100 px-4 py-2 text-xs font-black text-emerald-900 cursor-default opacity-90"
                        >
                          Current Plan
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleChoosePlan(plan)}
                          className={cn(
                            "pressable rounded-xl px-4 py-2.5 text-xs font-black transition-all shadow-md active:scale-95",
                            plan.theme === "gold" && "bg-gold text-navy hover:bg-gold-light",
                            plan.theme === "purple" && "border-2 border-purple-600 bg-white text-purple-900 hover:bg-purple-50",
                            plan.theme === "navy" && "bg-gold text-navy hover:bg-gold-light"
                          )}
                        >
                          {plan.ctaText}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* RIGHT FEATURES & GRAPHIC */}
                  <div className="col-span-6 space-y-2.5">
                    {/* Listings Badge */}
                    <div
                      className={cn(
                        "inline-block rounded-xl px-3 py-1 text-xs font-black",
                        isNavyTheme
                          ? "bg-blue-900/60 text-blue-200 border border-blue-700/50"
                          : "bg-slate-100 text-navy border border-slate-200"
                      )}
                    >
                      {plan.listingsBadge}
                    </div>

                    {/* Feature Checkmarks */}
                    <ul className="space-y-1.5 text-xs font-bold">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check
                            className={cn(
                              "h-3.5 w-3.5 shrink-0 stroke-[3]",
                              plan.theme === "green" && "text-emerald-600",
                              plan.theme === "gold" && "text-amber-600",
                              plan.theme === "purple" && "text-purple-600",
                              plan.theme === "navy" && "text-gold"
                            )}
                          />
                          <span
                            className={cn(
                              "leading-tight",
                              isNavyTheme ? "text-white/90" : "text-navy/90"
                            )}
                          >
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTTOM COMPARE PLANS FOOTER BANNER */}
        <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-800 border border-amber-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-navy">Flexible and risk-free</h3>
              <p className="text-[10px] font-medium text-navy/60">Upgrade, downgrade or cancel anytime.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCompareSheetOpen(true)}
            className="flex items-center gap-1 text-xs font-black text-navy hover:text-gold-dark transition-colors"
          >
            <span>Compare plans</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* CHECKOUT MODAL */}
      {selectedPlanForCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 text-navy">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black uppercase text-navy">Checkout</h3>
              <button
                type="button"
                onClick={() => setSelectedPlanForCheckout(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-navy"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 space-y-2 border border-slate-200 text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-navy/60">Plan</span>
                <span className="text-navy font-black">{selectedPlanForCheckout.name} ({selectedPlanForCheckout.subtitle})</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-navy/60">Billing Cycle</span>
                <span className="text-navy font-black">{billingCycle} Month{billingCycle > 1 ? "s" : ""}</span>
              </div>
              {discountPct > 0 && (
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Discount</span>
                  <span>{discountPct}% OFF</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black border-t border-slate-200 pt-2">
                <span>Total Billed</span>
                <span className="text-gold-dark">
                  ₦{getCalculatedPrice(selectedPlanForCheckout.monthlyBasePrice).total.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={paying}
              onClick={handleConfirmPayment}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gold py-3.5 text-xs font-black text-navy shadow-md hover:bg-gold-light active:scale-98"
            >
              <CreditCard className="h-4 w-4" />
              <span>{paying ? "Processing Payment…" : `Pay ₦${getCalculatedPrice(selectedPlanForCheckout.monthlyBasePrice).total.toLocaleString()} with Paystack`}</span>
            </button>

            <p className="text-center text-[10px] font-bold text-navy/50 flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" />
              <span>Encrypted & secure 256-bit SSL transaction</span>
            </p>
          </div>
        </div>
      )}

      {/* FEATURE COMPARISON BOTTOM SHEET */}
      {compareSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/70 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl space-y-4 text-navy">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black uppercase text-navy">Plan Feature Matrix</h3>
              <button
                type="button"
                onClick={() => setCompareSheetOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-navy"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* MATRIX TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-black text-navy">
                    <th className="p-2.5">Feature</th>
                    <th className="p-2.5 text-center">Core</th>
                    <th className="p-2.5 text-center">Pro</th>
                    <th className="p-2.5 text-center">Elite</th>
                    <th className="p-2.5 text-center">Prime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-navy/80">
                  <tr>
                    <td className="p-2.5 font-bold text-navy">Active Listings</td>
                    <td className="p-2.5 text-center">5</td>
                    <td className="p-2.5 text-center font-bold text-amber-700">30</td>
                    <td className="p-2.5 text-center font-bold text-purple-700">100</td>
                    <td className="p-2.5 text-center font-black text-gold-dark">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-navy">Business Profile</td>
                    <td className="p-2.5 text-center">✕</td>
                    <td className="p-2.5 text-center font-bold text-emerald-600">✓</td>
                    <td className="p-2.5 text-center font-bold text-emerald-600">✓</td>
                    <td className="p-2.5 text-center font-bold text-emerald-600">✓</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-navy">Team Members</td>
                    <td className="p-2.5 text-center">✕</td>
                    <td className="p-2.5 text-center">✕</td>
                    <td className="p-2.5 text-center font-bold text-emerald-600">✓ (5)</td>
                    <td className="p-2.5 text-center font-bold text-emerald-600">✓ Unlimited</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-navy">Priority Review</td>
                    <td className="p-2.5 text-center">Standard</td>
                    <td className="p-2.5 text-center font-bold text-emerald-600">Priority</td>
                    <td className="p-2.5 text-center font-bold text-emerald-600">Priority</td>
                    <td className="p-2.5 text-center font-black text-gold-dark">Instant</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-navy">Featured Discount</td>
                    <td className="p-2.5 text-center">0%</td>
                    <td className="p-2.5 text-center font-bold">10%</td>
                    <td className="p-2.5 text-center font-bold">15%</td>
                    <td className="p-2.5 text-center font-black text-gold-dark">20%</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-navy">Search Priority</td>
                    <td className="p-2.5 text-center">Normal</td>
                    <td className="p-2.5 text-center font-bold">High</td>
                    <td className="p-2.5 text-center font-bold">Very High</td>
                    <td className="p-2.5 text-center font-black text-gold-dark">Top Rank</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() => setCompareSheetOpen(false)}
              className="w-full rounded-2xl bg-navy py-3 text-xs font-black text-white hover:bg-navy-light"
            >
              Close Comparison
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
