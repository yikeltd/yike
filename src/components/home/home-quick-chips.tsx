"use client";

import { cn } from "@/lib/utils";
import type { QuickChip } from "@/lib/home/marketplace-quick-chips";

type Props = {
  chips: readonly QuickChip[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  className?: string;
  compact?: boolean;
};

/** Horizontal discovery chips — browse or filter marketplace categories. */
export function HomeQuickChips({
  chips,
  activeId,
  onSelect,
  className,
  compact = false,
}: Props) {
  return (
    <div
      className={cn(
        "-mx-1 flex overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        compact ? "gap-1.5" : "gap-2",
        className,
      )}
      role="listbox"
      aria-label="Browse categories"
    >
      {chips.map((chip) => {
        const active = activeId === chip.id;
        return (
          <button
            key={chip.id}
            type="button"
            role="option"
            aria-selected={active}
            aria-label={chip.label}
            onClick={() => onSelect(active ? null : chip.id)}
            className={cn(
              "pressable inline-flex shrink-0 items-center gap-1.5 font-bold transition-all duration-200",
              compact
                ? "rounded-xl px-2.5 py-1.5 text-[11px] sm:rounded-full sm:text-xs"
                : "rounded-full px-3.5 py-2 text-xs sm:text-sm",
              active
                ? "bg-navy text-white shadow-[0_6px_18px_rgba(3,27,78,0.22)]"
                : "bg-white/95 text-navy/70 shadow-sm ring-1 ring-navy/10 hover:-translate-y-px hover:text-navy hover:ring-navy/20 hover:shadow-md",
            )}
          >
            {chip.emoji ? (
              <span className="text-[0.95em] leading-none" aria-hidden>
                {chip.emoji}
              </span>
            ) : null}
            <span>{chip.label}</span>
          </button>
        );
      })}
    </div>
  );
}
