"use client";

import Link from "next/link";
import { RefreshCw, MapPinned, Wallet, Compass } from "lucide-react";
import type { DiscoverFilterState } from "@/lib/discover/filters";

type Props = {
  filters: DiscoverFilterState;
  onRefresh: () => void;
  onExpandRadius: () => void;
  onIncreaseBudget: () => void;
};

export function DiscoverEmpty({
  filters,
  onRefresh,
  onExpandRadius,
  onIncreaseBudget,
}: Props) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 pb-[var(--bottom-nav-stack)] text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15 text-gold">
        <Compass className="h-7 w-7" strokeWidth={2.25} aria-hidden />
      </div>
      <h2 className="mt-5 text-xl font-bold text-white">
        You&apos;ve seen everything matching your filters.
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/65">
        Refresh the deck, widen your search, or explore nearby listings on the
        homepage.
      </p>

      <div className="mt-8 flex w-full max-w-sm flex-col gap-2.5">
        <button
          type="button"
          onClick={onRefresh}
          className="pressable inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-gold px-5 text-sm font-bold text-navy"
        >
          <RefreshCw className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          Refresh
        </button>
        <button
          type="button"
          onClick={onExpandRadius}
          className="pressable inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/18 bg-white/10 px-5 text-sm font-semibold text-white"
        >
          <MapPinned className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          Expand radius
          {filters.city ? ` (clear ${filters.city})` : ""}
        </button>
        <button
          type="button"
          onClick={onIncreaseBudget}
          className="pressable inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/18 bg-white/10 px-5 text-sm font-semibold text-white"
        >
          <Wallet className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          Increase budget
        </button>
        <Link
          href="/?focus=search"
          className="pressable inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold text-gold"
        >
          Explore nearby cities
        </Link>
      </div>
    </div>
  );
}
