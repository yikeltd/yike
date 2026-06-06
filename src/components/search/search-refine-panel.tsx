"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { SearchRefineFilters } from "./search-refine-filters";
import { cn } from "@/lib/utils";

export function SearchRefinePanel({
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
        "mx-3 mb-2 overflow-hidden rounded-xl border border-navy/8 bg-white shadow-sm lg:mx-auto lg:max-w-2xl lg:px-0 xl:max-w-7xl",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pressable flex w-full items-center justify-between px-3.5 py-2.5 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-bold text-foreground">
          <SlidersHorizontal className="h-4 w-4 text-gold" />
          Refine filters
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open ? <SearchRefineFilters className="border-t border-navy/8 pt-2" /> : null}
    </div>
  );
}
