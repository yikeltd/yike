"use client";

import { useState } from "react";
import type { Property } from "@/types/database";
import {
  BOOST_PRICING,
  FEATURED_PRICING,
  type BoostPlanId,
  type FeaturedDurationDays,
  type PromotionType,
} from "@/lib/featured-promotions/constants";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

type PromoteResult = {
  promotion_reference: string;
  message: string;
  paymentsEnabled: boolean;
};

export function PromoteListingModal({
  listing,
  paymentsEnabled,
  onClose,
}: {
  listing: Property;
  paymentsEnabled: boolean;
  onClose: () => void;
}) {
  const [featuredDays, setFeaturedDays] = useState<FeaturedDurationDays>(7);
  const [boostPlan, setBoostPlan] = useState<BoostPlanId>("hours24");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PromoteResult | null>(null);

  async function handleContinue(promotionType: PromotionType) {
    setBusy(true);
    setError(null);
    const payload =
      promotionType === "boost"
        ? { promotionType, boostPlan }
        : { promotionType, durationDays: featuredDays };

    const res = await fetch(`/api/agent/listings/${listing.id}/promote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as {
      error?: string;
      promotion?: { promotion_reference: string };
      payment?: { authorizationUrl?: string };
      message?: string;
      paymentsEnabled?: boolean;
    };
    setBusy(false);

    if (!res.ok) {
      setError(data.error ?? "Could not start promotion");
      return;
    }

    const payEnabled = data.paymentsEnabled ?? paymentsEnabled;
    const checkoutUrl = data.payment?.authorizationUrl;

    if (payEnabled && checkoutUrl) {
      window.location.href = checkoutUrl;
      return;
    }

    setResult({
      promotion_reference: data.promotion?.promotion_reference ?? "",
      message: data.message ?? "",
      paymentsEnabled: payEnabled,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promote-listing-title"
    >
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="promote-listing-title" className="text-lg font-bold text-navy">
              Promote listing
            </h2>
            <p className="mt-1 text-sm text-muted">
              Get more visibility across Yike.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-bold text-muted hover:bg-surface"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="mt-3 line-clamp-1 text-sm font-medium text-navy">{listing.title}</p>

        {result ? (
          <div className="mt-4 space-y-3 rounded-xl border border-gold/30 bg-gold/5 p-4">
            <p className="text-sm font-medium text-navy">Promotion created</p>
            <p className="font-mono text-xs text-muted">{result.promotion_reference}</p>
            {!result.paymentsEnabled ? (
              <p className="text-sm text-muted">
                Payment integration coming online. Admin activation only.
              </p>
            ) : (
              <p className="text-sm text-muted">{result.message}</p>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-navy py-3 text-sm font-bold text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            <section className="rounded-xl border-2 border-gold/40 bg-gold/5 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gold-dark">
                Featured
              </p>
              <p className="mt-1 text-xs text-muted">Premium placement across Yike</p>
              <div className="mt-3 grid gap-2">
                {([7, 30] as FeaturedDurationDays[]).map((days) => {
                  const tier = FEATURED_PRICING[days];
                  const selected = featuredDays === days;
                  return (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setFeaturedDays(days)}
                      className={cn(
                        "flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors",
                        selected
                          ? "border-gold bg-white"
                          : "border-gold/20 bg-white/60 hover:border-gold/50"
                      )}
                    >
                      <span className="text-sm font-semibold text-navy">{tier.label}</span>
                      <span className="text-sm font-bold text-navy">
                        {formatPrice(tier.amount, "total", listing.listing_type)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleContinue("featured")}
                className="mt-3 w-full rounded-xl bg-gold py-2.5 text-sm font-bold text-navy disabled:opacity-60"
              >
                {busy ? "Processing…" : "Continue with Featured"}
              </button>
            </section>

            <section className="rounded-xl border border-border bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">
                Boost
              </p>
              <p className="mt-1 text-xs text-muted">Ranking advantage in search and browse</p>
              <div className="mt-3 grid gap-2">
                {(["hours24", "days7"] as BoostPlanId[]).map((planId) => {
                  const tier = BOOST_PRICING[planId];
                  const selected = boostPlan === planId;
                  return (
                    <button
                      key={planId}
                      type="button"
                      onClick={() => setBoostPlan(planId)}
                      className={cn(
                        "flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors",
                        selected
                          ? "border-navy/25 bg-surface"
                          : "border-border hover:border-navy/15"
                      )}
                    >
                      <span className="text-sm font-semibold text-navy">{tier.label}</span>
                      <span className="text-sm font-bold text-navy">
                        {formatPrice(tier.amount, "total", listing.listing_type)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleContinue("boost")}
                className="mt-3 w-full rounded-xl border border-navy/15 bg-surface py-2.5 text-sm font-bold text-navy disabled:opacity-60"
              >
                {busy ? "Processing…" : "Continue with Boost"}
              </button>
            </section>

            {error ? <p className="text-sm text-danger">{error}</p> : null}
          </div>
        )}
      </div>
    </div>
  );
}
