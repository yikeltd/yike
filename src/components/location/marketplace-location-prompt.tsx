"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import {
  markLocationPromptSeen,
  requestMarketplaceGeolocation,
  type MarketplaceLocation,
} from "@/lib/marketplace-location";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onAllow: (loc: MarketplaceLocation) => void;
  onDismiss: () => void;
};

/**
 * First-visit only — lightweight Allow / Not Now.
 * Never blocks browsing; no State/City form here.
 */
export function MarketplaceLocationPrompt({
  open,
  onAllow,
  onDismiss,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function onAllowClick() {
    setBusy(true);
    setError(null);
    const result = await requestMarketplaceGeolocation();
    setBusy(false);
    if (!result.ok) {
      markLocationPromptSeen();
      setError(
        result.reason === "denied"
          ? "Location access was denied. You can change this anytime next to the logo."
          : "Couldn't detect your location. You can pick a city anytime next to the logo.",
      );
      // Soft fail — still dismiss so browsing continues
      window.setTimeout(() => onDismiss(), 1800);
      return;
    }
    trackEvent("search", {
      placement: "marketplace_location_prompt_allow",
      city: result.location.city,
      state: result.location.state,
    });
    onAllow(result.location);
  }

  function onNotNow() {
    markLocationPromptSeen();
    trackEvent("search", { placement: "marketplace_location_prompt_dismiss" });
    onDismiss();
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-navy/35 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="marketplace-location-prompt-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Dismiss location prompt"
        onClick={onNotNow}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-sm rounded-t-2xl border border-navy/10 bg-white p-5 shadow-float-lg sm:rounded-2xl",
        )}
      >
        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
          <MapPin className="h-5 w-5" aria-hidden />
        </div>
        <h2
          id="marketplace-location-prompt-title"
          className="mt-3 text-lg font-bold text-navy"
        >
          Show Listings Near You?
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Allow location access to discover properties and vehicles near you.
        </p>

        {error ? (
          <p className="mt-3 text-xs font-medium text-amber-800">{error}</p>
        ) : null}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onNotNow}
            className="pressable flex-1 rounded-xl border border-navy/10 bg-navy/[0.03] px-3 py-2.5 text-sm font-semibold text-navy disabled:opacity-60"
          >
            Not Now
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onAllowClick()}
            className="pressable flex-1 rounded-xl bg-gold px-3 py-2.5 text-sm font-bold text-navy shadow-glow-gold disabled:opacity-60"
          >
            {busy ? "Detecting…" : "Allow"}
          </button>
        </div>
      </div>
    </div>
  );
}
