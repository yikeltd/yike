"use client";

import { cn } from "@/lib/utils";

export type SearchFilterChip = {
  id: string;
  label: string;
  active: boolean;
  onToggle: () => void;
};

/** Compact premium filter chips with clear active states. */
export function SearchFilterChips({
  chips,
  className,
  "aria-label": ariaLabel = "Quick filters",
}: {
  chips: SearchFilterChip[];
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div
      className={cn(
        "hide-scrollbar flex gap-1.5 overflow-x-auto pb-0.5",
        className,
      )}
      role="listbox"
      aria-label={ariaLabel}
      aria-multiselectable
    >
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          role="option"
          aria-selected={chip.active}
          onClick={chip.onToggle}
          className={cn(
            "pressable inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-150",
            chip.active
              ? "bg-navy text-white shadow-[0_4px_14px_rgba(3,27,78,0.2)]"
              : "bg-white text-navy/65 ring-1 ring-navy/10 hover:text-navy hover:ring-navy/18",
          )}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
