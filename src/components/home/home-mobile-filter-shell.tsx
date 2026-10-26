"use client";

import { useEffect, useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** When false, renders filters + search without collapse chrome (desktop). */
  collapseEnabled: boolean;
  expanded: boolean;
  onExpandedChange: (open: boolean) => void;
  summary?: string;
  onResetFilters?: () => void;
  filterControls: React.ReactNode;
  searchButton: React.ReactNode;
  /** When false, hides the primary search CTA (homepage progressive disclosure). */
  showSearchButton?: boolean;
  className?: string;
};

/** Shared collapsed filter bar chrome (Vehicles / Properties / Electronics). */
export const HOME_MOBILE_FILTER_TOGGLE_CLASS =
  "pressable flex w-full min-h-[44px] items-center justify-between gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-left text-sm font-semibold text-white transition-colors hover:bg-white/[0.14] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/70";

export const HOME_MOBILE_FILTER_EXPANDED_PANEL_CLASS =
  "max-h-[min(70vh,28rem)] space-y-2.5 overflow-y-auto rounded-xl border border-white/15 bg-[#031B4E]/95 p-2.5 backdrop-blur-sm";

/** Mobile homepage — compact filter entry; preserves filter state while collapsed. */
export function HomeMobileFilterShell({
  collapseEnabled,
  expanded,
  onExpandedChange,
  summary,
  onResetFilters,
  filterControls,
  searchButton,
  showSearchButton = true,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const isOpen = open || expanded;

  useEffect(() => {
    if (!expanded) {
      setOpen(false);
    }
  }, [expanded]);

  function setExpanded(next: boolean) {
    setOpen(next);
    onExpandedChange(next);
  }

  if (!collapseEnabled) {
    return (
      <div className={cn("space-y-2", className)}>
        {filterControls}
        {showSearchButton ? searchButton : null}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {!isOpen ? (
        <button
          type="button"
          data-testid="home-mobile-filters-toggle"
          onClick={() => setExpanded(true)}
          className={HOME_MOBILE_FILTER_TOGGLE_CLASS}
          aria-expanded={false}
        >
          <span className="flex min-w-0 items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-gold" aria-hidden />
            <span className="truncate">{summary?.trim() || "Filters & location"}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-white/70" aria-hidden />
        </button>
      ) : (
        <div
          className={HOME_MOBILE_FILTER_EXPANDED_PANEL_CLASS}
          data-testid="home-mobile-filters-expanded"
        >
          <div className="flex items-center justify-between gap-2 px-0.5">
            <button
              type="button"
              data-testid="home-mobile-filters-done"
              onClick={() => setExpanded(false)}
              className="text-xs font-bold text-gold"
            >
              Done
            </button>
            {onResetFilters ? (
              <button
                type="button"
                data-testid="home-mobile-filters-reset"
                onClick={onResetFilters}
                className="text-xs font-medium text-white/70 underline-offset-2 hover:underline"
              >
                Reset filters
              </button>
            ) : null}
          </div>
          {filterControls}
          {showSearchButton ? (
            <div data-testid="home-mobile-search-cta">{searchButton}</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
