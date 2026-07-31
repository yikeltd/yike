"use client";

import { Clock } from "lucide-react";

export function PerformanceDashboard() {
  const percentiles = [
    { label: "P50 Latency (Median)", value: "24ms", desc: "50% of requests complete within 24ms", color: "text-emerald-600 dark:text-emerald-400" },
    { label: "P95 Latency", value: "45ms", desc: "95% of requests complete within 45ms", color: "text-gold-dark dark:text-gold" },
    { label: "P99 Latency (Tail)", value: "88ms", desc: "99% of requests complete within 88ms", color: "text-purple-600 dark:text-purple-400" },
    { label: "Throughput (Peak)", value: "420 req/s", desc: "Current peak traffic throughput SLA", color: "text-blue-600 dark:text-blue-400" },
  ];

  const slowEndpoints = [
    { endpoint: "POST /api/v1/escrow/ESC_9814/fund", avgLatency: "38ms", p99Latency: "84ms", queries: "4 SQL Queries" },
    { endpoint: "GET /api/v1/listings/search", avgLatency: "24ms", p99Latency: "48ms", queries: "2 SQL Queries" },
    { endpoint: "GET /api/v1/trust/passport/USR_8810", avgLatency: "26ms", p99Latency: "52ms", queries: "3 SQL Queries" },
  ];

  return (
    <div className="space-y-6 text-xs select-none">
      
      {/* LATENCY PERCENTILES GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {percentiles.map((p, idx) => (
          <div
            key={idx}
            className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-md space-y-1"
          >
            <span className="text-[10px] font-black uppercase text-navy/50 dark:text-white/50">{p.label}</span>
            <p className={`text-2xl font-black ${p.color} tracking-tight`}>{p.value}</p>
            <p className="text-[10px] text-navy/60 dark:text-white/60 font-semibold">{p.desc}</p>
          </div>
        ))}
      </div>

      {/* SLOWEST ENDPOINTS TABLE */}
      <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-gold" />
          Endpoint Response Latency & Database Query Breakdown
        </h3>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-wider text-navy/50 dark:text-white/50">
              <th className="py-2.5 px-3">Endpoint Route</th>
              <th className="py-2.5 px-3">Avg Latency</th>
              <th className="py-2.5 px-3">P99 Latency</th>
              <th className="py-2.5 px-3 text-right">DB Query Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-semibold text-navy dark:text-white">
            {slowEndpoints.map((ep, idx) => (
              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                <td className="py-3 px-3 font-mono text-[11px] font-black text-navy dark:text-gold">{ep.endpoint}</td>
                <td className="py-3 px-3 font-mono text-[11px]">{ep.avgLatency}</td>
                <td className="py-3 px-3 font-mono text-[11px] font-bold text-rose-600 dark:text-rose-400">{ep.p99Latency}</td>
                <td className="py-3 px-3 text-right text-navy/70 dark:text-white/70">{ep.queries}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
