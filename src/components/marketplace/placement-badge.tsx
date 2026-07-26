"use client";

import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlacementKind } from "@/lib/marketplace/placement";
import { placementBadgeLabel } from "@/lib/marketplace/placement";

/**
 * Single placement pill for listing cards.
 * Trust badges stay separate — never stack Featured + Trending + New.
 */
export function PlacementBadge({
  kind,
  className,
  compact = false,
}: {
  kind: PlacementKind;
  className?: string;
  compact?: boolean;
}) {
  const label = placementBadgeLabel(kind);

  if (kind === "featured") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md bg-gold font-bold text-navy shadow-[0_0_12px_rgba(228,181,71,0.45)]",
          compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px] uppercase tracking-wide",
          className,
        )}
      >
        {compact ? "Feat" : label}
      </span>
    );
  }

  if (kind === "trending") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-md bg-orange-500/95 font-bold text-white",
          compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px] uppercase tracking-wide",
          className,
        )}
      >
        <TrendingUp className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} aria-hidden />
        {label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-sky-500/95 font-bold text-white",
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px] uppercase tracking-wide",
        className,
      )}
    >
      {label}
    </span>
  );
}

/** Subtle featured chrome — premium, not an ad banner. */
export function featuredPlacementChrome(active: boolean): string {
  return active
    ? "ring-1 ring-gold/55 shadow-[0_0_0_1px_rgba(228,181,71,0.28),0_10px_28px_-18px_rgba(228,181,71,0.55)]"
    : "";
}
