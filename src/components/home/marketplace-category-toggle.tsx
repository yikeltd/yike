"use client";

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

/** Uber-style Vehicles | Properties — animated gold pill (marketplace switch). */
export function MarketplaceCategoryToggle({
  category,
  onChange,
  className,
  compact = false,
  tone = "default",
}: Props) {
  const vehiclesOn = isLaunchFeatureVisible("vehicle_marketplace");
  const showVehicles = vehiclesOn;
  /** When both tabs show, Vehicles is left (primary); Properties is right. */
  const pillOnRight = showVehicles && category === "property";
  const onDark = tone === "onDark";

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
            ? "max-w-sm p-1"
            : "max-w-sm p-0.5 shadow-[0_2px_10px_rgba(2,20,51,0.06)]"
          : "max-w-sm p-1 shadow-[0_8px_28px_rgba(2,20,51,0.12)]",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute rounded-full bg-gold shadow-[0_4px_16px_rgba(228,181,71,0.55)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          compact && !onDark ? "inset-y-0.5" : "inset-y-1",
          showVehicles
            ? compact && !onDark
              ? "left-0.5 w-[calc(50%-2px)]"
              : "left-1 w-[calc(50%-4px)]"
            : compact && !onDark
              ? "left-0.5 right-0.5 w-auto"
              : "left-1 right-1 w-auto",
          pillOnRight ? "translate-x-full" : "translate-x-0",
        )}
      />
      {showVehicles ? (
        <button
          type="button"
          role="tab"
          aria-selected={category === "vehicle"}
          onClick={() => onChange("vehicle")}
          className={cn(
            "relative z-[1] flex-1 rounded-full text-center font-bold uppercase transition-colors duration-200",
            compact && !onDark
              ? "px-3 py-2 text-[11px] tracking-[0.12em]"
              : onDark
                ? "px-4 py-2.5 text-xs tracking-[0.14em] sm:text-sm"
                : "px-4 py-2.5 text-xs tracking-[0.12em] sm:text-sm",
            category === "vehicle"
              ? "text-navy"
              : onDark
                ? "text-white/90 hover:text-white"
                : "text-navy/45 hover:text-navy/70",
          )}
        >
          Vehicles
        </button>
      ) : null}
      <button
        type="button"
        role="tab"
        aria-selected={category === "property"}
        onClick={() => onChange("property")}
        className={cn(
          "relative z-[1] flex-1 rounded-full text-center font-bold uppercase transition-colors duration-200",
          compact && !onDark
            ? "px-3 py-2 text-[11px] tracking-[0.12em]"
            : onDark
              ? "px-4 py-2.5 text-xs tracking-[0.14em] sm:text-sm"
              : "px-4 py-2.5 text-xs tracking-[0.12em] sm:text-sm",
          category === "property"
            ? "text-navy"
            : onDark
              ? "text-white/90 hover:text-white"
              : "text-navy/45 hover:text-navy/70",
        )}
      >
        Properties
      </button>
    </div>
  );
}
