"use client";

import { ShieldAlert, CheckCircle2, Lock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function FraudWarningBanner({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className={cn("rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 p-2.5 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2", className)}>
        <div className="flex items-center gap-2 min-w-0">
          <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="font-bold text-[11px] truncate">
            Never pay cash before physical inspection or Yike Escrow.
          </p>
        </div>
        <Link href="/safety" className="text-[10px] font-black underline shrink-0 hover:text-amber-700">
          Safety Tips
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-800/60 p-4 sm:p-5 text-navy dark:text-white space-y-3 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-2xl bg-amber-500 text-navy font-black">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <div>
            <h4 className="text-sm font-black text-navy dark:text-amber-300">
              Yike Anti-Fraud Guarantee & Buyer Safety
            </h4>
            <p className="text-[10px] font-semibold text-navy/60 dark:text-white/60">
              Official Marketplace Safety Guidelines
            </p>
          </div>
        </div>
        <Link
          href="/safety"
          className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/60 px-3 py-1 text-xs font-bold text-amber-900 dark:text-amber-300 hover:bg-amber-200"
        >
          <span>Safety Guide</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
        <div className="flex items-start gap-2 p-2.5 rounded-2xl bg-white dark:bg-navy/80 border border-slate-100 dark:border-white/10">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>Inspect property or vehicle physically at a public location before signing contract.</span>
        </div>
        <div className="flex items-start gap-2 p-2.5 rounded-2xl bg-white dark:bg-navy/80 border border-slate-100 dark:border-white/10">
          <Lock className="h-4 w-4 text-gold shrink-0 mt-0.5" />
          <span>Pay using Yike Auto Escrow — funds are held safe until you verify keys & ownership papers.</span>
        </div>
      </div>
    </div>
  );
}
