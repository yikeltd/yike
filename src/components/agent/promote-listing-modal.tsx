"use client";

import { useState } from "react";
import type { Property } from "@/types/database";
import {
  FEATURED_PRICING,
  type FeaturedDurationDays,
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
  const [durationDays, setDurationDays] = useState<FeaturedDurationDays>(7);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PromoteResult | null>(null);

  async function handleContinue() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/agent/listings/${listing.id}/promote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationDays }),
    });
    setBusy(false);
    const data = (await res.json()) as {
      error?: string;
      promotion?: { promotion_reference: string };
      message?: string;
      paymentsEnabled?: boolean;
    };
    if (!res.ok) {
      setError(data.error ?? "Could not start promotion");
      return;
    }
    setResult({
      promotion_reference: data.promotion?.promotion_reference ?? "",
      message: data.message ?? "",
      paymentsEnabled: data.paymentsEnabled ?? paymentsEnabled,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promote-listing-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="promote-listing-title" className="text-lg font-bold text-navy">
              Feature this listing
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
          <>
            <div className="mt-4 grid gap-2">
              {([7, 30] as FeaturedDurationDays[]).map((days) => {
                const tier = FEATURED_PRICING[days];
                const selected = durationDays === days;
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setDurationDays(days)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors",
                      selected
                        ? "border-gold bg-gold/10"
                        : "border-border bg-white hover:border-navy/20"
                    )}
                  >
                    <span className="font-semibold text-navy">{tier.label}</span>
                    <span className="font-bold text-navy">
                      {formatPrice(tier.amount, "total", listing.listing_type)}
                    </span>
                  </button>
                );
              })}
            </div>

            {error ? (
              <p className="mt-3 text-sm text-danger">{error}</p>
            ) : null}

            <button
              type="button"
              disabled={busy}
              onClick={handleContinue}
              className="mt-4 w-full rounded-xl bg-gold py-3 text-sm font-bold text-navy disabled:opacity-60"
            >
              {busy ? "Creating…" : "Continue"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
