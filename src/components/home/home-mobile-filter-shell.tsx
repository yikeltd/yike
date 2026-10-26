"use client";

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
  className?: string;
};

/** Mobile homepage — compact filter entry; preserves filter state while collapsed. */
export function HomeMobileFilterShell({
  collapseEnabled,
  expanded,
  onExpandedChange,
  summary,
  onResetFilters,
  filterControls,
  searchButton,
  className,
}: Props) {
  if (!collapseEnabled) {
    return (
      <div className={cn("space-y-2", className)}>
        {filterControls}
        {searchButton}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {!expanded ? (
        <button
          type="button"
          onClick={() => onExpandedChange(true)}
          className="pressable flex w-full items-center justify-between gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-left text-sm font-semibold text-white"
          aria-expanded={false}
        >
          <span className="flex min-w-0 items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-gold" aria-hidden />
            <span className="truncate">{summary?.trim() || "Filters & location"}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-white/70" aria-hidden />
        </button>
      ) : (
        <div className="space-y-2.5 rounded-xl border border-white/15 bg-white/5 p-2.5">
          <div className="flex items-center justify-between gap-2 px-0.5">
            <button
              type="button"
              onClick={() => onExpandedChange(false)}
              className="text-xs font-bold text-gold"
            >
              Done
            </button>
            {onResetFilters ? (
              <button
                type="button"
                onClick={onResetFilters}
                className="text-xs font-medium text-white/70 underline-offset-2 hover:underline"
              >
                Reset filters
              </button>
            ) : null}
          </div>
          {filterControls}
        </div>
      )}
      {searchButton}
    </div>
  );
}
