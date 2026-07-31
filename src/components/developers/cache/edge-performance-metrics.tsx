"use client";

import type { EdgeRegion } from "@/types/cache-performance";
import { Globe, HardDrive } from "lucide-react";

export function EdgePerformanceMetrics() {
  const regions: EdgeRegion[] = [
    { id: "reg_1", name: "Lagos POP (Main Edge)", popLocation: "LOS-01 (Lekki)", avgLatencyMs: 2, cacheHitRate: "99.8%", status: "healthy" },
    { id: "reg_2", name: "Abuja POP (North Edge)", popLocation: "ABV-01 (Maitama)", avgLatencyMs: 4, cacheHitRate: "99.4%", status: "healthy" },
    { id: "reg_3", name: "Port Harcourt POP (South Edge)", popLocation: "PHC-01 (GRA)", avgLatencyMs: 5, cacheHitRate: "99.2%", status: "healthy" },
    { id: "reg_4", name: "London POP (EU Gateway)", popLocation: "LHR-02 (Docklands)", avgLatencyMs: 18, cacheHitRate: "98.9%", status: "healthy" },
  ];

  const compressionStats = [
    { format: "Brotli", original: "1.4 MB", compressed: "420 KB", savings: "70.0% Bandwidth Saved" },
    { format: "Gzip", original: "1.4 MB", compressed: "510 KB", savings: "63.5% Bandwidth Saved" },
  ];

  return (
    <div className="space-y-6 text-xs select-none">
      
      {/* GLOBAL POP NODES LATENCY MAP */}
      <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-gold" />
            <h3 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white">
              Global CDN POP Node Latency & Edge Cache Hit Rates
            </h3>
          </div>

          <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[9px] font-black uppercase">
            4 Edge Regions Healthy
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {regions.map((reg) => (
            <div
              key={reg.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2"
            >
              <div className="flex items-center justify-between font-black">
                <span className="text-navy dark:text-white text-xs">{reg.name}</span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div>
                  <span className="text-navy/40 dark:text-white/40 block">Edge Latency</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{reg.avgLatencyMs}ms</span>
                </div>
                <div>
                  <span className="text-navy/40 dark:text-white/40 block">CDN Hit Rate</span>
                  <span className="font-bold text-navy dark:text-gold">{reg.cacheHitRate}</span>
                </div>
              </div>

              <span className="text-[9px] font-mono text-navy/40 dark:text-white/40 block">POP: {reg.popLocation}</span>
            </div>
          ))}
        </div>
      </div>

      {/* BROTLI COMPRESSION ANALYSIS */}
      <div className="p-6 rounded-3xl bg-[#031B4E] text-white border border-white/10 shadow-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <HardDrive className="h-5 w-5 text-gold" />
          <h3 className="text-xs font-black uppercase tracking-wider text-gold">
            Payload Brotli / Gzip Compression Efficiency
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {compressionStats.map((cs, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-white text-sm">{cs.format} Compression</span>
                <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 text-[9px] font-black uppercase">
                  {cs.savings}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-white/70">
                <span>Original Payload: {cs.original}</span>
                <span>→</span>
                <span>Compressed: <strong className="text-gold">{cs.compressed}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
