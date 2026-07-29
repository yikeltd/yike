"use client";

import { useState, useEffect } from "react";
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
  CheckCircle2,
  History,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import type { SubscriptionPlanCode } from "@/lib/subscriptions/constants";

type BillingCycle = 1 | 3 | 6 | 12;

type Plan = {
  id: "core" | "pro" | "elite" | "prime";
  backendCode: SubscriptionPlanCode;
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
    backendCode: "free",
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
    backendCode: "pro_agent",
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
    backendCode: "agency",
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
    backendCode: "developer",
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

type StepState = "idle" | "opening_paystack" | "waiting_payment" | "verifying" | "success" | "error";

export function SellerPlansView() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(1);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<Plan | null>(null);
  const [compareSheetOpen, setCompareSheetOpen] = useState(false);
  const [historySheetOpen, setHistorySheetOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<StepState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [activatedPlan, setActivatedPlan] = useState<Plan | null>(null);

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
    setErrorMessage(null);
    setPaymentStep("idle");
    setSelectedPlanForCheckout(plan);
  }

  // Real Paystack Checkout & Verification Flow
  async function handleStartPaystackPayment() {
    if (!selectedPlanForCheckout) return;
    setErrorMessage(null);
    setPaymentStep("opening_paystack");

    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planCode: selectedPlanForCheckout.backendCode,
          billingMonths: billingCycle,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMessage(data.error || "Unable to initialize checkout.");
        setPaymentStep("error");
        return;
      }

      // Handle Staging / Dev Mode Activation
      if (!data.paymentsLive) {
        setPaymentStep("verifying");
        setActivatedPlan(selectedPlanForCheckout);
        setSelectedPlanForCheckout(null);
        setShowCelebration(true);
        return;
      }

      // Handle Live Paystack Checkout Window
      if (data.authorizationUrl) {
        setPaymentStep("waiting_payment");
        const popup = window.open(data.authorizationUrl, "_blank", "width=500,height=700");

        // Poll for backend transaction verification
        const reference = data.reference;
        const interval = setInterval(async () => {
          try {
            const verifyRes = await fetch(`/api/payments/verify/${encodeURIComponent(reference)}`);
            const verifyData = await verifyRes.json();

            if (verifyData.fulfilled || verifyData.status === "successful") {
              clearInterval(interval);
              if (popup && !popup.closed) popup.close();
              setPaymentStep("verifying");
              setActivatedPlan(selectedPlanForCheckout);
              setSelectedPlanForCheckout(null);
              setShowCelebration(true);
            }
          } catch {
            /* continue polling */
          }
        }, 2500);

        // Clear poll if popup closed or timeout (5 mins)
        setTimeout(() => clearInterval(interval), 300000);
      }
    } catch (err: unknown) {
      setErrorMessage("Network error initializing payment. Please try again.");
      setPaymentStep("error");
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#f8fafc] text-navy pb-24 select-none">
      {/* FULL-SCREEN SUCCESS CELEBRATION VIEW */}
      {showCelebration && activatedPlan ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-navy p-6 text-white text-center animate-in fade-in zoom-in-95 duration-300">
          {/* Confetti & Glow Background Effect */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/30 via-navy to-navy pointer-events-none" />

          <div className="relative pt-12 space-y-4 max-w-sm mx-auto">
            {/* Celebration Icon Badge */}
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-gold via-amber-400 to-amber-600 text-navy shadow-2xl ring-4 ring-gold/40 animate-bounce">
              <CheckCircle2 className="h-12 w-12 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <span className="inline-block rounded-full bg-gold/20 border border-gold/40 px-3 py-1 text-[11px] font-black uppercase text-gold">
                Payment Successful
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Welcome to <span className="text-gold">{activatedPlan.name}</span>!
              </h2>
            </div>

            <p className="text-xs font-semibold text-white/80 leading-relaxed px-2">
              Your subscription is now active. All {activatedPlan.name} membership benefits, verified business status, and listing limits are now unlocked!
            </p>
          </div>

          {/* Celebration Action Buttons */}
          <div className="relative pb-10 space-y-2.5 w-full max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => {
                setShowCelebration(false);
                router.push("/agent");
              }}
              className="pressable flex w-full items-center justify-center gap-2 rounded-2xl bg-gold py-3.5 text-xs font-black text-navy shadow-xl hover:bg-gold-light active:scale-98"
            >
              <span>View My Profile</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowCelebration(false);
                router.push("/agent/listings/choose");
              }}
              className="pressable flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 py-3.5 text-xs font-bold text-white hover:bg-white/20 active:scale-98"
            >
              <span>List Another Property</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowCelebration(false);
                router.push("/discover");
              }}
              className="pressable text-xs font-bold text-white/60 hover:text-white pt-1 block w-full"
            >
              Continue Browsing
            </button>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl px-3.5 pt-4 space-y-4">
          {/* PAGE TITLE */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-navy">
              Seller plans
            </h1>

            <button
              type="button"
              onClick={() => setHistorySheetOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-navy/15 bg-white px-3 py-1.5 text-xs font-bold text-navy shadow-xs hover:bg-slate-50"
            >
              <History className="h-3.5 w-3.5 text-gold-dark" />
              <span>Payment History</span>
            </button>
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

                    {/* RIGHT FEATURES */}
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
      )}

      {/* CHECKOUT MODAL WITH REAL PAYSTACK STATES */}
      {selectedPlanForCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 text-navy">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black uppercase text-navy">Checkout</h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedPlanForCheckout(null);
                  setPaymentStep("idle");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-navy"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-900">
                {errorMessage}
              </div>
            )}

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
              disabled={paymentStep !== "idle" && paymentStep !== "error"}
              onClick={handleStartPaystackPayment}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gold py-3.5 text-xs font-black text-navy shadow-md hover:bg-gold-light active:scale-98 disabled:opacity-75"
            >
              <CreditCard className="h-4 w-4" />
              <span>
                {paymentStep === "opening_paystack" && "Opening Paystack…"}
                {paymentStep === "waiting_payment" && "Waiting for Payment…"}
                {paymentStep === "verifying" && "Verifying Payment…"}
                {(paymentStep === "idle" || paymentStep === "error") &&
                  `Continue to Payment (₦${getCalculatedPrice(selectedPlanForCheckout.monthlyBasePrice).total.toLocaleString()})`}
              </span>
            </button>

            <p className="text-center text-[10px] font-bold text-navy/50 flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" />
              <span>Encrypted & secure Paystack checkout</span>
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

      {/* PAYMENT HISTORY SHEET */}
      {historySheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/70 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl space-y-4 text-navy">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black uppercase text-navy">Payment History</h3>
              <button
                type="button"
                onClick={() => setHistorySheetOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-navy"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-black text-navy block">Pro Plan (3 Months)</span>
                  <span className="text-[10px] text-navy/60 block">Ref: PST-94021-82 • July 28, 2026</span>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="font-black text-gold-dark block">₦26,997</span>
                  <span className="inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                    Successful
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setHistorySheetOpen(false)}
              className="w-full rounded-2xl bg-navy py-3 text-xs font-black text-white hover:bg-navy-light"
            >
              Close History
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
