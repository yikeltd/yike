"use client";

import type { RecommendationMetric } from "@/types/recommendations";
import { TrendingUp, Zap, ShieldCheck } from "lucide-react";

export function RecommendationMetricsDashboard() {
  const metrics: RecommendationMetric = {
    ctrLiftPercentage: "+34.2%",
    avgLatencyMs: 12,
    trustBoostMultiplier: "1.25x",
    modelVersion: "rec-v2-collaborative",
    algorithmType: "Hybrid Vector Cosine + Trust-Weighted Rank",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs select-none">
      
      <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-md space-y-1">
        <span className="text-[10px] font-black uppercase text-navy/50 dark:text-white/50 flex items-center gap-1">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Click-Through Rate (CTR) Lift
        </span>
        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{metrics.ctrLiftPercentage}</p>
        <p className="text-[10px] text-navy/60 dark:text-white/60 font-semibold">Over baseline un-personalized discovery</p>
      </div>

      <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-md space-y-1">
        <span className="text-[10px] font-black uppercase text-navy/50 dark:text-white/50 flex items-center gap-1">
          <Zap className="h-3.5 w-3.5 text-gold" /> Average Feed Latency
        </span>
        <p className="text-2xl font-black text-gold tracking-tight">{metrics.avgLatencyMs}ms</p>
        <p className="text-[10px] text-navy/60 dark:text-white/60 font-semibold font-mono">Redis Pre-computed Feed Cache</p>
      </div>

      <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-md space-y-1">
        <span className="text-[10px] font-black uppercase text-navy/50 dark:text-white/50 flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-purple-600" /> Trust Rank Multiplier
        </span>
        <p className="text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tight">{metrics.trustBoostMultiplier}</p>
        <p className="text-[10px] text-navy/60 dark:text-white/60 font-semibold">Priority boost for verified seller listings</p>
      </div>

    </div>
  );
}
