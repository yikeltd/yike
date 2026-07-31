"use client";

import type { UptimeSlaMetric } from "@/types/production-monitoring";
import { ShieldCheck, Zap, Activity } from "lucide-react";

export function UptimeSlaCard() {
  const sla: UptimeSlaMetric = {
    targetUptime: "99.99%",
    actualUptime30d: "99.99%",
    actualUptime90d: "99.98%",
    p95LatencyMs: 42,
    p99LatencyMs: 88,
    totalRequestsToday: 1420900,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs select-none">
      
      <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-md space-y-1">
        <span className="text-[10px] font-black uppercase text-navy/50 dark:text-white/50 flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Platform Availability SLA Target
        </span>
        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{sla.actualUptime30d}</p>
        <p className="text-[10px] text-navy/60 dark:text-white/60 font-semibold font-mono">Target: {sla.targetUptime} Annual Uptime</p>
      </div>

      <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-md space-y-1">
        <span className="text-[10px] font-black uppercase text-navy/50 dark:text-white/50 flex items-center gap-1">
          <Zap className="h-3.5 w-3.5 text-gold" /> API Response Latency (P95 / P99)
        </span>
        <p className="text-2xl font-black text-gold tracking-tight">{sla.p95LatencyMs}ms / {sla.p99LatencyMs}ms</p>
        <p className="text-[10px] text-navy/60 dark:text-white/60 font-semibold font-mono">Sub-50ms P95 Latency Target</p>
      </div>

      <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-md space-y-1">
        <span className="text-[10px] font-black uppercase text-navy/50 dark:text-white/50 flex items-center gap-1">
          <Activity className="h-3.5 w-3.5 text-purple-600" /> Daily Processed Requests
        </span>
        <p className="text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tight">{sla.totalRequestsToday.toLocaleString()}</p>
        <p className="text-[10px] text-navy/60 dark:text-white/60 font-semibold">Zero-Downtime Hot Deployments</p>
      </div>

    </div>
  );
}
