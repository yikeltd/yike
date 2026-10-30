"use client";

import {
  Car,
  Home,
  LayoutGrid,
  Smartphone,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getDiscoverCategoryOptions,
  getDiscoverElectronicsSubOptions,
} from "@/lib/discover/categories";
import type { DiscoverFilterState } from "@/lib/discover/filters";

const ICONS: Record<string, LucideIcon> = {
  "layout-grid": LayoutGrid,
  home: Home,
  car: Car,
  smartphone: Smartphone,
};

type Props = {
  filters: DiscoverFilterState;
  onChange: (next: DiscoverFilterState) => void;
  electronicsTypesOpen?: boolean;
  onToggleElectronicsTypes?: () => void;
  className?: string;
};

export function DiscoverCategoryRail({
  filters,
  onChange,
  electronicsTypesOpen = false,
  onToggleElectronicsTypes,
  className,
}: Props) {
  const options = getDiscoverCategoryOptions();
  const electronicsSubs = getDiscoverElectronicsSubOptions();
  const showElectronicsSubs =
    filters.category === "electronics" &&
    electronicsTypesOpen &&
    electronicsSubs.length > 0;

  return (
    <div
      className={cn(
        "absolute inset-x-0 z-20 top-[calc(max(3.75rem,env(safe-area-inset-top))+3.25rem)]",
        className,
      )}
    >
      <div
        role="tablist"
        aria-label="Discover categories"
        className="hide-scrollbar flex gap-2 overflow-x-auto px-4 pb-1.5 snap-x snap-mandatory"
      >
        {options.map((opt) => {
          const Icon = ICONS[opt.icon] ?? LayoutGrid;
          const selected =
            filters.category === opt.id &&
            (opt.id !== "electronics" || !filters.electronicsSub);
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() =>
                onChange({
                  ...filters,
                  category: opt.id,
                  electronicsSub:
                    opt.id === "electronics" ? filters.electronicsSub : "",
                  deal: opt.id === "vehicle" ? "" : filters.deal,
                })
              }
              className={cn(
                "pressable inline-flex min-h-[44px] shrink-0 snap-start items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold tracking-normal backdrop-blur-md",
                selected
                  ? "border-gold/60 bg-gold text-navy shadow-sm"
                  : "border-white/20 bg-black/45 text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="whitespace-nowrap">{opt.shortLabel}</span>
            </button>
          );
        })}

        {filters.category === "electronics" && onToggleElectronicsTypes ? (
          <button
            type="button"
            onClick={onToggleElectronicsTypes}
            aria-expanded={electronicsTypesOpen}
            className={cn(
              "pressable inline-flex min-h-[44px] shrink-0 snap-start items-center gap-1 rounded-full border px-3.5 py-2 text-xs font-semibold backdrop-blur-md",
              electronicsTypesOpen || filters.electronicsSub
                ? "border-white/35 bg-white/20 text-white"
                : "border-white/15 bg-black/35 text-white/85",
            )}
          >
            Type
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                electronicsTypesOpen ? "rotate-180" : "",
              )}
              aria-hidden
            />
          </button>
        ) : null}
      </div>

      {showElectronicsSubs ? (
        <div
          className="hide-scrollbar mt-2 flex flex-wrap gap-2 px-4 pb-1"
          aria-label="Electronics types"
        >
          {electronicsSubs.map((sub) => {
            const selected = filters.electronicsSub === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() =>
                  onChange({
                    ...filters,
                    category: "electronics",
                    electronicsSub: selected ? "" : sub.id,
                  })
                }
                className={cn(
                  "pressable min-h-[36px] rounded-full px-3 py-1.5 text-[11px] font-semibold",
                  selected
                    ? "bg-white text-navy"
                    : "bg-white/15 text-white/90",
                )}
              >
                {sub.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
