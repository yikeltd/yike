"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { SearchFiltersBar } from "./search-filters-bar";
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
    <div className={cn("border-b border-surface bg-elevated/95", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pressable flex w-full items-center justify-between px-3 py-2.5 text-left lg:px-0"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-bold text-foreground">
          <SlidersHorizontal className="h-4 w-4 text-gold" />
          Advanced filters
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="border-t border-surface pb-2 pt-1">
          <SearchFiltersBar />
        </div>
      )}
    </div>
  );
}
