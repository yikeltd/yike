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
  CheckCircle2,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import type { SubscriptionPlanCode } from "@/lib/subscriptions/constants";
import { SellerPlanIllustration } from "@/components/pricing/seller-plan-illustration";

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
  illustration: string;
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
    illustration: "/assets/seller-plan/core.webp",
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
    illustration: "/assets/seller-plan/pro.webp",
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
    illustration: "/assets/seller-plan/elite.webp",
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
    illustration: "/assets/seller-plan/prime.webp",
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
  const [selectedProvider, setSelectedProvider] = useState<"paystack" | "korapay">("paystack");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("yike_preferred_payment_provider");
      if (saved === "korapay" || saved === "paystack") {
        setSelectedProvider(saved);
      }
    } catch {
      /* ignore storage errors */
    }
  }, []);

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

  async function handleStartPayment() {
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
          provider: selectedProvider,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMessage(data.error || "Unable to initialize checkout.");
        setPaymentStep("error");
        return;
      }

      if (!data.paymentsLive) {
        setPaymentStep("verifying");
        setActivatedPlan(selectedPlanForCheckout);
        setSelectedPlanForCheckout(null);
        setShowCelebration(true);
        return;
      }

      if (data.authorizationUrl) {
        setPaymentStep("waiting_payment");
        const popup = window.open(data.authorizationUrl, "_blank", "width=500,height=700");
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

        setTimeout(() => clearInterval(interval), 300000);
      }
    } catch {
      setErrorMessage("Network error initializing payment. Please try again.");
      setPaymentStep("error");
    }
  }

  return (
    <div className="min-h-[100dvh] bg-white text-[#031B4E] pb-24 select-none">
      {/* CELEBRATION MODAL */}
      {showCelebration && activatedPlan ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#031B4E] p-6 text-white text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#E4B547]/30 via-[#031B4E] to-[#031B4E] pointer-events-none" />
          <div className="relative pt-12 space-y-4 max-w-sm mx-auto">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#E4B547] via-amber-400 to-amber-600 text-[#031B4E] shadow-2xl ring-4 ring-[#E4B547]/40 animate-bounce">
              <CheckCircle2 className="h-12 w-12 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <span className="inline-block rounded-full bg-[#E4B547]/20 border border-[#E4B547]/40 px-3 py-1 text-[11px] font-black uppercase text-[#E4B547]">
                Payment Successful
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Welcome to <span className="text-[#E4B547]">{activatedPlan.name}</span>!
              </h2>
            </div>
            <p className="text-xs font-semibold text-white/80 leading-relaxed px-2">
              Your subscription is active. All {activatedPlan.name} membership benefits and listing limits are unlocked!
            </p>
          </div>
          <div className="relative pb-10 space-y-2.5 w-full max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => {
                setShowCelebration(false);
                router.push("/agent");
              }}
              className="pressable flex w-full items-center justify-center gap-2 rounded-2xl bg-[#E4B547] py-3.5 text-xs font-black text-[#031B4E] shadow-xl hover:bg-amber-400 active:scale-98"
            >
              <span>View My Profile</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-md px-4 pt-4 space-y-4">
          {/* PAGE TITLE */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-[28px] font-black tracking-tight text-[#031B4E]">
              Seller plans
            </h1>
            <button
              type="button"
              onClick={() => setHistorySheetOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-[#031B4E] shadow-2xs hover:bg-slate-50"
            >
              <History className="h-3.5 w-3.5 text-[#E4B547]" />
              <span>History</span>
            </button>
          </div>

          {/* BILLING CYCLE SELECTOR */}
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-white p-1 border border-slate-200/90 shadow-2xs text-center items-center">
            <button
              type="button"
              onClick={() => setBillingCycle(1)}
              className={cn(
                "py-2 rounded-lg text-xs font-bold transition-all",
                billingCycle === 1
                  ? "bg-white border border-[#E4B547] text-[#031B4E] shadow-2xs"
                  : "text-[#031B4E]/60 hover:text-[#031B4E]"
              )}
            >
              Monthly
            </button>

            <button
              type="button"
              onClick={() => setBillingCycle(3)}
              className={cn(
                "py-1 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center",
                billingCycle === 3
                  ? "bg-white border border-[#E4B547] text-[#031B4E] shadow-2xs"
                  : "text-[#031B4E]/60 hover:text-[#031B4E]"
              )}
            >
              <span>3 Months</span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/90 rounded-md px-1 py-0.5 mt-0.5">Save 10%</span>
            </button>

            <button
              type="button"
              onClick={() => setBillingCycle(6)}
              className={cn(
                "py-1 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center",
                billingCycle === 6
                  ? "bg-white border border-[#E4B547] text-[#031B4E] shadow-2xs"
                  : "text-[#031B4E]/60 hover:text-[#031B4E]"
              )}
            >
              <span>6 Months</span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/90 rounded-md px-1 py-0.5 mt-0.5">Save 20%</span>
            </button>

            <button
              type="button"
              onClick={() => setBillingCycle(12)}
              className={cn(
                "py-1 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center",
                billingCycle === 12
                  ? "bg-white border border-[#E4B547] text-[#031B4E] shadow-2xs"
                  : "text-[#031B4E]/60 hover:text-[#031B4E]"
              )}
            >
              <span>12 Months</span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/90 rounded-md px-1 py-0.5 mt-0.5">Save 30%</span>
            </button>
          </div>

          {/* STACKED FULL-WIDTH PRICING CARDS */}
          <div className="space-y-3.5">
            {PLANS.map((plan) => {
              const { monthly } = getCalculatedPrice(plan.monthlyBasePrice);
              const isNavyTheme = plan.theme === "navy";

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-all shadow-2xs border-2",
                    plan.theme === "green" && "border-emerald-200/90 bg-white text-[#031B4E]",
                    plan.theme === "gold" && "border-amber-400/90 bg-gradient-to-r from-amber-50/60 via-amber-50/20 to-amber-100/40 text-[#031B4E]",
                    plan.theme === "purple" && "border-purple-400/90 bg-gradient-to-r from-purple-50/60 via-purple-50/20 to-purple-100/40 text-[#031B4E]",
                    plan.theme === "navy" && "border-blue-950 bg-[#071330] text-white shadow-2xl"
                  )}
                >
                  {/* BADGES */}
                  {plan.popularBadge && (
                    <div className="absolute top-0 right-0 rounded-bl-xl bg-[#F59E0B] px-3 py-1 text-[10px] font-bold uppercase text-white shadow-2xs flex items-center gap-1 tracking-wide">
                      <span>★</span>
                      <span>{plan.popularBadge}</span>
                    </div>
                  )}
                  {plan.premiumBadge && (
                    <div className="absolute top-3 right-3 rounded-lg border border-amber-400/60 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1">
                      <span>💎</span>
                      <span>{plan.premiumBadge}</span>
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    {/* LEFT COLUMN */}
                    <div className="w-[125px] shrink-0 space-y-2">
                      {/* Icon */}
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full shrink-0",
                          plan.theme === "green" && "bg-emerald-100/80 text-emerald-600",
                          plan.theme === "gold" && "bg-amber-100 text-amber-600",
                          plan.theme === "purple" && "bg-purple-100 text-purple-600",
                          plan.theme === "navy" && "bg-blue-950/90 border border-blue-700/60 text-blue-400"
                        )}
                      >
                        {plan.id === "core" && <User className="h-4.5 w-4.5" />}
                        {plan.id === "pro" && <Crown className="h-4.5 w-4.5" />}
                        {plan.id === "elite" && <Building2 className="h-4.5 w-4.5" />}
                        {plan.id === "prime" && <Gem className="h-4.5 w-4.5" />}
                      </div>

                      <div>
                        <h2 className="text-lg font-bold tracking-tight leading-tight">{plan.name}</h2>
                        <p
                          className={cn(
                            "text-[11px] font-medium leading-tight",
                            isNavyTheme ? "text-slate-300" : "text-slate-500"
                          )}
                        >
                          {plan.subtitle}
                        </p>
                      </div>

                      {/* Price */}
                      <div>
                        <p className="text-xl font-bold tracking-tight leading-none">
                          {plan.monthlyBasePrice === 0
                            ? "₦0"
                            : `₦${monthly.toLocaleString()}`}
                        </p>
                        {plan.monthlyBasePrice > 0 && (
                          <span
                            className={cn(
                              "text-[11px] font-medium block mt-0.5",
                              isNavyTheme ? "text-slate-300" : "text-slate-500"
                            )}
                          >
                            / month
                          </span>
                        )}
                      </div>

                      {/* CTA Button */}
                      <div className="pt-1">
                        {plan.current ? (
                          <button
                            type="button"
                            disabled
                            className="rounded-xl bg-emerald-100/80 px-3.5 py-2 text-xs font-bold text-emerald-900 cursor-default opacity-95"
                          >
                            Current Plan
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleChoosePlan(plan)}
                            className={cn(
                              "pressable rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-2xs active:scale-95",
                              plan.theme === "gold" && "bg-[#F59E0B] text-[#031B4E] hover:bg-amber-400",
                              plan.theme === "purple" && "border-2 border-purple-500 bg-white text-purple-600 hover:bg-purple-50",
                              plan.theme === "navy" && "bg-[#F59E0B] text-[#031B4E] hover:bg-amber-400"
                            )}
                          >
                            {plan.ctaText}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* VERTICAL DIVIDER & RIGHT COLUMN */}
                    <div className={cn(
                      "pl-4 border-l flex-1 min-w-0 space-y-2.5 relative pb-8",
                      isNavyTheme ? "border-blue-900/60" : "border-slate-200/80"
                    )}>
                      {/* Listings Badge */}
                      <div
                        className={cn(
                          "inline-block rounded-full px-3 py-1 text-xs font-bold",
                          plan.theme === "green" && "bg-emerald-100/70 text-emerald-950",
                          plan.theme === "gold" && "bg-amber-100/90 text-amber-950",
                          plan.theme === "purple" && "bg-purple-100/90 text-purple-950",
                          plan.theme === "navy" && "bg-blue-900/90 text-blue-200 border border-blue-700/60"
                        )}
                      >
                        {plan.listingsBadge}
                      </div>

                      {/* Checklist */}
                      <ul className="space-y-1.5 text-xs font-medium">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span
                              className={cn(
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full p-0.5 text-white",
                                plan.theme === "green" && "bg-emerald-500",
                                plan.theme === "gold" && "bg-[#F59E0B]",
                                plan.theme === "purple" && "bg-purple-600",
                                plan.theme === "navy" && "bg-blue-500"
                              )}
                            >
                              <Check className="h-3 w-3 stroke-[3]" />
                            </span>
                            <span
                              className={cn(
                                "leading-tight truncate",
                                isNavyTheme ? "text-slate-100" : "text-slate-800"
                              )}
                            >
                              {feat}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* Illustration Image Overlay */}
                      <SellerPlanIllustration
                        planId={plan.id}
                        priority={plan.id === "core" || plan.id === "pro"}
                        className={cn(
                          "absolute right-0 bottom-0 pointer-events-none bg-transparent p-0 opacity-95 max-w-[120px] max-h-[95px]",
                          plan.id === "core" && "h-20 w-auto",
                          plan.id === "pro" && "h-24 w-auto",
                          plan.id === "elite" && "h-24 w-auto",
                          plan.id === "prime" && "h-28 w-auto"
                        )}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* BOTTOM COMPARE FOOTER */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#031B4E]">Flexible & Risk-Free</h3>
                <p className="text-[10px] font-medium text-slate-500">Upgrade or cancel anytime.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCompareSheetOpen(true)}
              className="flex items-center gap-1 text-xs font-bold text-[#031B4E] hover:text-amber-600 transition-colors"
            >
              <span>Compare</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {selectedPlanForCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#031B4E]/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 text-[#031B4E]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold uppercase text-[#031B4E]">Checkout</h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedPlanForCheckout(null);
                  setPaymentStep("idle");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[#031B4E]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-900">
                <p>{errorMessage}</p>
              </div>
            )}

            <div className="rounded-2xl bg-slate-50 p-4 space-y-2 border border-slate-200 text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-slate-500">Plan</span>
                <span className="text-[#031B4E]">{selectedPlanForCheckout.name} ({selectedPlanForCheckout.subtitle})</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-500">Billing Cycle</span>
                <span className="text-[#031B4E]">{billingCycle} Month{billingCycle > 1 ? "s" : ""}</span>
              </div>
              {discountPct > 0 && (
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Discount</span>
                  <span>{discountPct}% OFF</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2">
                <span>Total Billed</span>
                <span className="text-amber-600">
                  ₦{getCalculatedPrice(selectedPlanForCheckout.monthlyBasePrice).total.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-[11px] font-bold uppercase text-slate-500">Choose Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProvider("paystack")}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center",
                    selectedProvider === "paystack"
                      ? "border-[#031B4E] bg-[#031B4E]/5 ring-2 ring-[#031B4E]/20 font-bold"
                      : "border-slate-200 bg-slate-50 opacity-70"
                  )}
                >
                  <span className="text-xs font-bold text-[#031B4E]">Paystack</span>
                  <span className="text-[9px] font-medium text-slate-500">Cards & Bank</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProvider("korapay")}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center",
                    selectedProvider === "korapay"
                      ? "border-[#031B4E] bg-[#031B4E]/5 ring-2 ring-[#031B4E]/20 font-bold"
                      : "border-slate-200 bg-slate-50 opacity-70"
                  )}
                >
                  <span className="text-xs font-bold text-[#031B4E]">Korapay</span>
                  <span className="text-[9px] font-medium text-slate-500">Cards & Transfer</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={paymentStep !== "idle" && paymentStep !== "error"}
              onClick={handleStartPayment}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F59E0B] py-3.5 text-xs font-bold text-[#031B4E] shadow-md hover:bg-amber-400 active:scale-98 disabled:opacity-75"
            >
              <CreditCard className="h-4 w-4" />
              <span>
                {paymentStep === "opening_paystack" && `Opening ${selectedProvider === "korapay" ? "Korapay" : "Paystack"}…`}
                {paymentStep === "waiting_payment" && "Waiting for Payment…"}
                {paymentStep === "verifying" && "Verifying Payment…"}
                {(paymentStep === "idle" || paymentStep === "error") &&
                  `Continue to Payment (₦${getCalculatedPrice(selectedPlanForCheckout.monthlyBasePrice).total.toLocaleString()})`}
              </span>
            </button>

            <p className="text-center text-[10px] font-bold text-slate-400 flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" />
              <span>Encrypted & secure checkout via {selectedProvider === "korapay" ? "Korapay" : "Paystack"}</span>
            </p>
          </div>
        </div>
      )}

      {/* FEATURE COMPARISON SHEET */}
      {compareSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#031B4E]/70 backdrop-blur-xs">
          <div className="w-full max-w-xl max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl space-y-4 text-[#031B4E]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold uppercase text-[#031B4E]">Plan Feature Matrix</h3>
              <button
                type="button"
                onClick={() => setCompareSheetOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[#031B4E]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-bold text-[#031B4E]">
                    <th className="p-2.5">Feature</th>
                    <th className="p-2.5 text-center">Core</th>
                    <th className="p-2.5 text-center">Pro</th>
                    <th className="p-2.5 text-center">Elite</th>
                    <th className="p-2.5 text-center">Prime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  <tr>
                    <td className="p-2.5 font-bold text-[#031B4E]">Active Listings</td>
                    <td className="p-2.5 text-center">5</td>
                    <td className="p-2.5 text-center font-bold text-amber-600">30</td>
                    <td className="p-2.5 text-center font-bold text-purple-600">100</td>
                    <td className="p-2.5 text-center font-bold text-amber-600">Unlimited</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={() => setCompareSheetOpen(false)}
              className="w-full rounded-2xl bg-[#031B4E] py-3 text-xs font-bold text-white"
            >
              Close Comparison
            </button>
          </div>
        </div>
      )}

      {/* PAYMENT HISTORY SHEET */}
      {historySheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#031B4E]/70 backdrop-blur-xs">
          <div className="w-full max-w-xl max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl space-y-4 text-[#031B4E]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold uppercase text-[#031B4E]">Payment History</h3>
              <button
                type="button"
                onClick={() => setHistorySheetOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[#031B4E]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#031B4E] block">Pro Plan (3 Months)</span>
                  <span className="text-[10px] text-slate-500 block">Ref: PST-94021-82 • July 28, 2026</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-amber-600 block">₦26,997</span>
                  <span className="inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                    Successful
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHistorySheetOpen(false)}
              className="w-full rounded-2xl bg-[#031B4E] py-3 text-xs font-bold text-white"
            >
              Close History
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
