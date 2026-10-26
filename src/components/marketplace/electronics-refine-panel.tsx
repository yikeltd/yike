"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { ElectronicsRefineFilters } from "./electronics-refine-filters";
import { cn } from "@/lib/utils";

export function ElectronicsRefinePanel({
  defaultOpen = false,
  className,
}: {
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "mx-3 mb-2 overflow-hidden rounded-2xl border border-navy/8 bg-white shadow-[0_4px_20px_rgba(3,27,78,0.05)] lg:mx-6 xl:mx-8",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pressable flex w-full items-center justify-between px-3.5 py-2.5 text-left"
        aria-expanded={open}
        data-testid="electronics-refine-toggle"
      >
        <span className="flex items-center gap-2 text-sm font-bold tracking-tight text-navy">
          <SlidersHorizontal className="h-3.5 w-3.5 text-gold" />
          Filters
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-navy/40 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <ElectronicsRefineFilters className="border-t border-navy/6" />
      ) : null}
    </div>
  );
}
