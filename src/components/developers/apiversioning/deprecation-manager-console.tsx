"use client";

import type { DeprecationPolicy } from "@/types/api-versioning";
import { AlertTriangle, Clock, ShieldCheck } from "lucide-react";

export function DeprecationManagerConsole() {
  const policy: DeprecationPolicy = {
    policyVersion: "2026.1",
    minimumNoticeMonths: 12,
    sunsetWindowMonths: 6,
    activeSunsetNotices: 0,
  };

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-4 text-xs select-none">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gold" />
          <h3 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white">
            Deprecation & Sunset Policy Manager
          </h3>
        </div>

        <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[9px] font-black uppercase font-mono">
          0 ACTIVE DEPRECATION WARNINGS
        </span>
      </div>

      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3 font-mono text-[11px]">
        <div className="flex items-center justify-between">
          <span className="font-bold text-navy dark:text-white flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            HTTP Sunset-Date & Deprecation Header Injection Rules
          </span>
          <span className="text-[10px] text-navy/60 dark:text-white/60">Policy v{policy.policyVersion}</span>
        </div>

        <p className="text-[10px] text-navy/70 dark:text-white/70">
          All deprecated endpoints will emit standard RFC 8594 <code className="text-gold font-bold">Deprecation: true</code> and <code className="text-gold font-bold">Sunset-Date</code> HTTP response headers at least 12 months prior to physical decommissioning.
        </p>

        <div className="flex items-center gap-4 text-[10px] text-navy/60 dark:text-white/60 pt-2 border-t border-slate-200 dark:border-white/10">
          <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-gold" /> Minimum Notice: 12 Months</span>
          <span>Sunset Window: 6 Months</span>
          <span>Active Sunset Warnings: 0</span>
        </div>
      </div>
    </div>
  );
}
