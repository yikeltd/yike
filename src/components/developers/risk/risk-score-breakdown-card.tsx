"use client";

import type { RiskAssessment } from "@/types/risk-intelligence";
import { ShieldAlert, AlertTriangle, CheckCircle2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function RiskScoreBreakdownCard() {
  const assessments: RiskAssessment[] = [
    {
      id: "risk_101",
      targetId: "ESC_9814",
      targetType: "escrow",
      targetTitle: "₦18,500,000 Milestone Custody Deposit",
      riskScore: 12,
      riskLevel: "low",
      anomalyFlags: ["Matching Verified NIN/CAC", "Clean IP Velocity", "Consistent Pricing Range"],
      recommendedAction: "PASS - Release Custody Normal Flow",
      timestamp: "2026-07-31T03:45:00.000Z",
    },
    {
      id: "risk_102",
      targetId: "LST_4401",
      targetType: "listing",
      targetTitle: "2024 Lexus LX 600 Ultra Luxury (Listed at ₦15M)",
      riskScore: 88,
      riskLevel: "critical",
      anomalyFlags: ["Price Anomaly (80% Below Market Value)", "Unverified New Seller Account", "5 IP Logins from 3 Distinct Countries in 10 mins"],
      recommendedAction: "FREEZE_ESCROW_CUSTODY & Require Physical Inspection",
      timestamp: "2026-07-31T03:12:00.000Z",
    },
  ];

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-500" />
            AI Transaction & Listing Risk Score Anomaly Breakdown
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Real-time risk scoring engine analyzing device velocity, price anomalies, and document authenticity.
          </p>
        </div>

        <span className="rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2.5 py-0.5 text-[9px] font-black uppercase">
          1 Anomaly Freeze Active
        </span>
      </div>

      {/* RISK CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assessments.map((ast) => (
          <div
            key={ast.id}
            className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3 shadow-md flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase font-mono",
                    ast.riskLevel === "critical"
                      ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                      : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  Risk Score: {ast.riskScore}/100 ({ast.riskLevel.toUpperCase()})
                </span>
                <span className="font-mono text-[10px] text-navy/50 dark:text-white/50">{ast.targetId}</span>
              </div>

              <h3 className="font-black text-sm text-navy dark:text-white leading-snug">{ast.targetTitle}</h3>

              <div className="space-y-1 pt-1">
                <span className="text-[9px] font-black text-navy/40 dark:text-white/40 uppercase">Detected Risk Indicators:</span>
                <div className="space-y-1">
                  {ast.anomalyFlags.map((flag, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-1.5 text-[10px] font-mono">
                      {ast.riskLevel === "critical" ? (
                        <AlertTriangle className="h-3 w-3 text-rose-500 shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                      )}
                      <span className={ast.riskLevel === "critical" ? "text-rose-600 dark:text-rose-400 font-bold" : "text-navy/70 dark:text-white/70"}>
                        {flag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[10px] font-mono">
              <span className="font-bold text-navy dark:text-gold flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Action: {ast.recommendedAction}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
