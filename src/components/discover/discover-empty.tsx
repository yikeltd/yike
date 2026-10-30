"use client";

import { Compass } from "lucide-react";
import type { DiscoverFilterState } from "@/lib/discover/filters";
import {
  DISCOVER_EMPTY_PRIMARY_LABELS,
  discoverFiltersAreRestrictive,
  getDiscoverEmptyCopy,
  getDiscoverEmptyPrimaryAction,
  type DiscoverEmptyReason,
} from "@/lib/discover/empty-state";

type Props = {
  reason: DiscoverEmptyReason;
  filters: DiscoverFilterState;
  onRefresh: () => void;
  onClearFilters: () => void;
  onBrowseAllCategories: () => void;
  onExpandRadius: () => void;
  onIncreaseBudget: () => void;
};

export function DiscoverEmpty({
  reason,
  filters,
  onRefresh,
  onClearFilters,
  onBrowseAllCategories,
  onExpandRadius,
  onIncreaseBudget,
}: Props) {
  const { title, subtitle } = getDiscoverEmptyCopy(reason, filters);
  const primary = getDiscoverEmptyPrimaryAction(reason, filters);

  const onPrimary = () => {
    switch (primary) {
      case "refresh_deck":
        onRefresh();
        break;
      case "increase_budget":
        onIncreaseBudget();
        break;
      case "widen_search":
        onExpandRadius();
        break;
      case "browse_all_categories":
        onBrowseAllCategories();
        break;
      case "clear_filters":
        onClearFilters();
        break;
      default:
        break;
    }
  };

  const secondary =
    reason === "deck_exhausted" &&
    primary === "refresh_deck" &&
    discoverFiltersAreRestrictive(filters)
      ? ("clear_filters" as const)
      : null;

  return (
    <div
      className="flex h-full flex-col items-center justify-center px-6 pb-[var(--bottom-nav-stack)] text-center"
      data-testid="discover-empty"
      data-empty-reason={reason}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15 text-gold">
        <Compass className="h-7 w-7" strokeWidth={2.25} aria-hidden />
      </div>
      <h2 className="mt-5 max-w-sm text-xl font-bold text-white">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/65">
        {subtitle}
      </p>

      <div className="mt-8 flex w-full max-w-sm flex-col gap-2.5">
        <button
          type="button"
          onClick={onPrimary}
          className="pressable inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-gold px-5 text-sm font-bold text-navy"
        >
          {DISCOVER_EMPTY_PRIMARY_LABELS[primary]}
        </button>
        {secondary ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="pressable inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/18 bg-white/10 px-5 text-sm font-semibold text-white"
          >
            {DISCOVER_EMPTY_PRIMARY_LABELS.clear_filters}
          </button>
        ) : null}
      </div>
    </div>
  );
}
