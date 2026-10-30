"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { HomeMarketplaceCategory } from "@/lib/home/marketplace-category";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";

type Props = {
  category: HomeMarketplaceCategory;
  onChange: (category: HomeMarketplaceCategory) => void;
  className?: string;
  /** Smaller control for compact homepage discovery header. */
  compact?: boolean;
  /** Hero overlay on dark imagery. */
  tone?: "default" | "onDark";
};

type TabDef = { id: HomeMarketplaceCategory; label: string };

/** Vehicles | Properties | Electronics — animated gold pill. */
export function MarketplaceCategoryToggle({
  category,
  onChange,
  className,
  compact = false,
  tone = "default",
}: Props) {
  const vehiclesOn = isLaunchFeatureVisible("vehicle_marketplace");
  const electronicsOn = isLaunchFeatureVisible("electronics_marketplace");

  const tabs = useMemo(() => {
    const list: TabDef[] = [];
    if (vehiclesOn) list.push({ id: "vehicle", label: "Vehicles" });
    list.push({ id: "property", label: "Properties" });
    if (electronicsOn) list.push({ id: "electronics", label: "Electronics" });
    return list;
  }, [vehiclesOn, electronicsOn]);

  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.id === category),
  );
  const tabCount = tabs.length;
  const onDark = tone === "onDark";

  if (tabCount <= 1) return null;

  return (
    <div
      role="tablist"
      aria-label="Marketplace category"
      className={cn(
        "relative mx-auto flex w-full rounded-full",
        onDark
          ? "bg-[#021433]/88 ring-2 ring-white/35 shadow-[0_10px_32px_rgba(0,0,0,0.45)] backdrop-blur-md"
          : "bg-navy/[0.04] ring-1 ring-navy/[0.08]",
        compact
          ? onDark
            ? "max-w-md p-1"
            : "max-w-md p-0.5 shadow-[0_2px_10px_rgba(2,20,51,0.06)]"
          : "max-w-md p-1 shadow-[0_8px_28px_rgba(2,20,51,0.12)]",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute rounded-full bg-gold shadow-[0_4px_16px_rgba(228,181,71,0.55)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          compact && !onDark ? "inset-y-0.5" : "inset-y-1",
          compact && !onDark ? "left-0.5" : "left-1",
        )}
        style={{
          width:
            compact && !onDark
              ? `calc(${100 / tabCount}% - 2px)`
              : `calc(${100 / tabCount}% - 4px)`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={category === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative z-[1] min-w-0 flex-1 truncate rounded-full text-center font-bold uppercase transition-colors duration-200",
            compact && !onDark
              ? "px-2 py-2 text-[10px] tracking-[0.08em] sm:text-[11px]"
              : onDark
                ? "px-2 py-2.5 text-[10px] tracking-[0.1em] sm:px-3 sm:text-xs"
                : "px-3 py-2.5 text-xs tracking-[0.12em]",
            category === tab.id
              ? "text-navy"
              : onDark
                ? "text-white/90 hover:text-white"
                : "text-navy/45 hover:text-navy/70",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
