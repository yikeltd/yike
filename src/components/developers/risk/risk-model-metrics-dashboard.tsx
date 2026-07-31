"use client";

import type { RiskModelPerformance } from "@/types/risk-intelligence";
import { ShieldCheck, Lock, AlertTriangle } from "lucide-react";

export function RiskModelMetricsDashboard() {
  const metrics: RiskModelPerformance = {
    accuracyPercentage: "99.4%",
    falsePositiveRate: "0.12%",
    fraudVolumeSaved: "₦450,000,000 NGN",
    totalScanned: 184900,
    modelVersion: "fraud-risk-v3-ensemble",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs select-none">
      
      <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-md space-y-1">
        <span className="text-[10px] font-black uppercase text-navy/50 dark:text-white/50 flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Risk Model Precision & Accuracy
        </span>
        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{metrics.accuracyPercentage}</p>
        <p className="text-[10px] text-navy/60 dark:text-white/60 font-semibold font-mono">{metrics.totalScanned.toLocaleString()} Scanned Transactions</p>
      </div>

      <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-md space-y-1">
        <span className="text-[10px] font-black uppercase text-navy/50 dark:text-white/50 flex items-center gap-1">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> False Positive Benchmark
        </span>
        <p className="text-2xl font-black text-gold tracking-tight">{metrics.falsePositiveRate}</p>
        <p className="text-[10px] text-navy/60 dark:text-white/60 font-semibold">Ultra-low disruption for legitimate buyers</p>
      </div>

      <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-md space-y-1">
        <span className="text-[10px] font-black uppercase text-navy/50 dark:text-white/50 flex items-center gap-1">
          <Lock className="h-3.5 w-3.5 text-purple-600" /> Total Fraud Volume Intercepted
        </span>
        <p className="text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tight">{metrics.fraudVolumeSaved}</p>
        <p className="text-[10px] text-navy/60 dark:text-white/60 font-semibold font-mono">Protected Escrow & Merchant Funds</p>
      </div>

    </div>
  );
}
