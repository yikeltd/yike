"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, ChevronLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function DeveloperAnalyticsDashboard() {
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d">("24h");

  const metrics = {
    "24h": { requests: "14,290", latency: "28ms", successRate: "99.94%", errorRate: "0.06%" },
    "7d": { requests: "98,420", latency: "31ms", successRate: "99.89%", errorRate: "0.11%" },
    "30d": { requests: "412,800", latency: "29ms", successRate: "99.92%", errorRate: "0.08%" },
  };

  const currentMetrics = metrics[timeframe];

  const topEndpoints = [
    { endpoint: "GET /api/v1/listings", requests: "8,420", avgLatency: "24ms", success: "99.9%" },
    { endpoint: "GET /api/v1/escrow/ESC_9814", requests: "3,110", avgLatency: "35ms", success: "100%" },
    { endpoint: "GET /api/v1/trust/USR_8810", requests: "2,760", avgLatency: "26ms", success: "99.8%" },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white py-8 px-4 sm:px-6 select-none">
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy/10 dark:border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Link href="/account/developer" className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-white/10 text-navy dark:text-white hover:bg-slate-300">
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-navy dark:text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-gold" />
                API Consumer Analytics Dashboard
              </h1>
              <p className="text-xs text-navy/60 dark:text-white/60 mt-0.5">
                Real-time API request volume, response latency, HTTP status codes, and webhook delivery metrics.
              </p>
            </div>
          </div>

          {/* TIMEFRAME SELECTOR */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200 dark:bg-white/10 rounded-2xl text-xs font-bold shrink-0">
            {(["24h", "7d", "30d"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-3 py-1.5 rounded-xl uppercase transition-all",
                  timeframe === tf
                    ? "bg-[#031B4E] dark:bg-gold text-white dark:text-navy font-black shadow-sm"
                    : "text-navy/70 dark:text-white/70 hover:bg-white dark:hover:bg-white/10"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* METRICS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-md space-y-1">
            <span className="text-[10px] font-black uppercase text-navy/50 dark:text-white/50">Total Requests</span>
            <p className="text-2xl font-black text-navy dark:text-white tracking-tight">{currentMetrics.requests}</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" />
              <span>+12.4% vs prev period</span>
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-md space-y-1">
            <span className="text-[10px] font-black uppercase text-navy/50 dark:text-white/50">Avg Latency</span>
            <p className="text-2xl font-black text-gold-dark dark:text-gold tracking-tight">{currentMetrics.latency}</p>
            <p className="text-[10px] text-navy/60 dark:text-white/60 font-semibold">Fast Response SLA</p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-md space-y-1">
            <span className="text-[10px] font-black uppercase text-navy/50 dark:text-white/50">Success Rate</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{currentMetrics.successRate}</p>
            <p className="text-[10px] text-navy/60 dark:text-white/60 font-semibold">HTTP 2xx Responses</p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-md space-y-1">
            <span className="text-[10px] font-black uppercase text-navy/50 dark:text-white/50">Error Rate</span>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">{currentMetrics.errorRate}</p>
            <p className="text-[10px] text-navy/60 dark:text-white/60 font-semibold">HTTP 4xx/5xx Responses</p>
          </div>
        </div>

        {/* TOP ENDPOINTS TABLE */}
        <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-3 text-xs">
          <h2 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white">
            Top Consumed API Endpoints ({timeframe})
          </h2>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-wider text-navy/50 dark:text-white/50">
                <th className="py-2.5 px-3">Endpoint Route</th>
                <th className="py-2.5 px-3">Requests</th>
                <th className="py-2.5 px-3">Avg Latency</th>
                <th className="py-2.5 px-3 text-right">Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-semibold text-navy dark:text-white">
              {topEndpoints.map((ep, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                  <td className="py-3 px-3 font-mono text-[11px] font-black text-navy dark:text-gold">{ep.endpoint}</td>
                  <td className="py-3 px-3">{ep.requests}</td>
                  <td className="py-3 px-3 font-mono text-[11px]">{ep.avgLatency}</td>
                  <td className="py-3 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">{ep.success}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
