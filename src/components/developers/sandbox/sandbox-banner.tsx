"use client";

import { TestTube } from "lucide-react";
import { cn } from "@/lib/utils";

export function SandboxBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200 shadow-md flex items-center justify-between gap-3 select-none",
        className
      )}
    >
      <div className="flex items-center gap-2.5 font-bold">
        <TestTube className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <div>
          <span className="font-black uppercase tracking-wider text-[11px] text-amber-700 dark:text-gold block">
            ISOLATED DEVELOPER SANDBOX ENVIRONMENT
          </span>
          <span className="text-[10px] opacity-90">
            All API requests, escrow deals, and test wallet transactions are mock simulations. No real funds or production data are modified.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <span className="rounded-full bg-amber-500 text-navy px-2.5 py-0.5 text-[9px] font-black uppercase">
          TEST MODE ACTIVE
        </span>
      </div>
    </div>
  );
}
