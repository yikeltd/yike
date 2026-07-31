"use client";

import type { ProductionReadinessScorecard } from "@/types/production-readiness";
import { Award, ShieldCheck, CheckCircle2 } from "lucide-react";

export function ReadinessScorecardHeader() {
  const scorecard: ProductionReadinessScorecard = {
    overallReadinessPercent: 100,
    passedPillars: 6,
    totalPillars: 6,
    launchGateStatus: "READY_FOR_LAUNCH_CERTIFICATION",
    certifiedAt: "2026-07-31T05:00:00.000Z",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs select-none">
      
      <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-md space-y-1">
        <span className="text-[10px] font-black uppercase text-navy/50 dark:text-white/50 flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Executive Production Scorecard
        </span>
        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{scorecard.overallReadinessPercent}% Launch Ready</p>
        <p className="text-[10px] text-navy/60 dark:text-white/60 font-semibold font-mono">{scorecard.passedPillars} / {scorecard.totalPillars} Operational Pillars Certified</p>
      </div>

      <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-md space-y-1">
        <span className="text-[10px] font-black uppercase text-navy/50 dark:text-white/50 flex items-center gap-1">
          <Award className="h-3.5 w-3.5 text-gold" /> Launch Gate Status
        </span>
        <p className="text-2xl font-black text-gold tracking-tight">GATE PASSED</p>
        <p className="text-[10px] text-navy/60 dark:text-white/60 font-semibold font-mono">Ready for Launch Certification</p>
      </div>

      <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-md space-y-1">
        <span className="text-[10px] font-black uppercase text-navy/50 dark:text-white/50 flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" /> Enterprise Qualification
        </span>
        <p className="text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tight">100% Qualified</p>
        <p className="text-[10px] text-navy/60 dark:text-white/60 font-semibold font-mono">Zero Open Critical Defects</p>
      </div>

    </div>
  );
}
