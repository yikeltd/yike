"use client";

import type { CacheZone } from "@/types/cache-performance";
import { Zap, Clock, ShieldCheck } from "lucide-react";

export function CacheZoneOverview() {
  const zones: CacheZone[] = [
    {
      id: "zone_1",
      name: "Search & Listing Queries",
      keyPattern: "listings:*",
      hitRatio: "94.2%",
      itemCount: 42800,
      memoryUsed: "256 MB",
      ttl: "5 minutes",
      status: "active",
      latencyMs: 14,
    },
    {
      id: "zone_2",
      name: "Trust Passport Scores",
      keyPattern: "trust:*",
      hitRatio: "98.6%",
      itemCount: 185000,
      memoryUsed: "128 MB",
      ttl: "1 hour",
      status: "active",
      latencyMs: 4,
    },
    {
      id: "zone_3",
      name: "Geospatial & Locations",
      keyPattern: "locations:*",
      hitRatio: "99.1%",
      itemCount: 12400,
      memoryUsed: "64 MB",
      ttl: "24 hours",
      status: "active",
      latencyMs: 6,
    },
    {
      id: "zone_4",
      name: "Static Asset Edge CDN",
      keyPattern: "media:*",
      hitRatio: "99.8%",
      itemCount: 940000,
      memoryUsed: "1.2 GB",
      ttl: "30 days",
      status: "active",
      latencyMs: 2,
    },
  ];

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-gold" />
            Redis Multi-Layer Cache Zones
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Active in-memory caching rules, hit ratio benchmarks, and eviction policies.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          <span>GLOBAL CACHE HIT RATIO: 97.9%</span>
        </div>
      </div>

      {/* CACHE ZONES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {zones.map((z) => (
          <div
            key={z.id}
            className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3 shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-black text-navy dark:text-gold text-xs block">{z.name}</span>
                <code className="text-[10px] font-mono text-navy/50 dark:text-white/50">{z.keyPattern}</code>
              </div>
              <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[9px] font-black uppercase">
                {z.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
              <div className="p-2 rounded-xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10">
                <span className="text-navy/40 dark:text-white/40 block text-[9px]">Hit Ratio</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">{z.hitRatio}</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10">
                <span className="text-navy/40 dark:text-white/40 block text-[9px]">Latency</span>
                <span className="font-black text-gold text-xs">{z.latencyMs}ms</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10">
                <span className="text-navy/40 dark:text-white/40 block text-[9px]">Memory</span>
                <span className="font-bold text-navy dark:text-white text-xs">{z.memoryUsed}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-navy/60 dark:text-white/60 pt-1">
              <span>Items: <strong className="font-mono text-navy dark:text-white">{z.itemCount.toLocaleString()}</strong></span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="h-3 w-3 text-gold" />
                TTL: {z.ttl}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
