"use client";

import type { ResourceSaturationMetric } from "@/types/load-testing";
import { Cpu, HardDrive, Database, Activity } from "lucide-react";

export function StressTestResultsChart() {
  const saturationMetrics: ResourceSaturationMetric[] = [
    { metricName: "CPU Peak Utilization", currentPeak: "64%", maxLimit: "100%", saturationPercent: 64, health: "optimal" },
    { metricName: "RAM Peak Allocation", currentPeak: "5.8 GB", maxLimit: "16 GB", saturationPercent: 36, health: "optimal" },
    { metricName: "DB Connection Pool Saturation", currentPeak: "84 Pool Active", maxLimit: "100 Pool", saturationPercent: 84, health: "elevated" },
    { metricName: "Background Queue Backlog Depth", currentPeak: "12 Jobs Backlog", maxLimit: "1,000 Jobs", saturationPercent: 12, health: "optimal" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs select-none">
      {saturationMetrics.map((m, idx) => (
        <div key={idx} className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-md space-y-2">
          <span className="text-[10px] font-black uppercase text-navy/50 dark:text-white/50 flex items-center gap-1">
            {idx === 0 ? <Cpu className="h-3.5 w-3.5 text-gold" /> : idx === 1 ? <HardDrive className="h-3.5 w-3.5 text-emerald-500" /> : idx === 2 ? <Database className="h-3.5 w-3.5 text-purple-600" /> : <Activity className="h-3.5 w-3.5 text-blue-500" />}
            {m.metricName}
          </span>
          <p className="text-xl font-black text-navy dark:text-white tracking-tight">{m.currentPeak}</p>
          <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div className={`h-1.5 rounded-full ${m.saturationPercent > 80 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${m.saturationPercent}%` }} />
          </div>
          <p className="text-[10px] text-navy/60 dark:text-white/60 font-semibold font-mono">Saturation: {m.saturationPercent}%</p>
        </div>
      ))}
    </div>
  );
}
