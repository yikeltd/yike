"use client";

import { useRouter, usePathname } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export function FloatingSearchBar({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <button
      type="button"
      onClick={() => router.push("/search")}
      className={cn(
        "pressable group flex w-full items-center gap-2 rounded-xl bg-surface/80 px-3 py-2.5 text-left transition-all duration-200",
        "focus-visible:ring-2 focus-visible:ring-gold/50",
        pathname === "/search" && "ring-2 ring-gold/40 bg-elevated"
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-gold transition-transform duration-200 group-active:scale-90" />
      <span className="flex-1 truncate text-sm text-muted">
        {compact ? "Search city, area, budget…" : "Where do you want to live?"}
      </span>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/5 text-navy">
        <SlidersHorizontal className="h-4 w-4" />
      </span>
    </button>
  );
}
