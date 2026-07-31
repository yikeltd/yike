"use client";

import Link from "next/link";
import { Activity, ChevronLeft, Building2, Cpu } from "lucide-react";

export function AdminDeveloperAnalytics() {
  const topConsumers = [
    { merchant: "Stankings Auto Dealership", keys: 2, calls24h: "48,290", latency: "24ms", tier: "Enterprise" },
    { merchant: "Lekki Homes Real Estate Agency", keys: 3, calls24h: "32,100", latency: "29ms", tier: "Enterprise" },
    { merchant: "Chief Stankings Properties", keys: 1, calls24h: "18,400", latency: "26ms", tier: "Pro Merchant" },
  ];

  const versionUsage = [
    { version: "v1.2 (Current Production)", share: "94%", status: "Active" },
    { version: "v0.9 (Legacy Deprecated)", share: "6%", status: "Deprecated" },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white pb-20 select-none">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-navy/10 dark:border-white/10 bg-[#031B4E] px-6 py-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <Link href="/lex/auth/developers" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider text-gold flex items-center gap-2">
              <Activity className="h-5 w-5 text-gold" />
              STAFF DEVELOPER PLATFORM ANALYTICS
            </h1>
            <p className="text-[11px] font-semibold text-white/70">
              Ecosystem API Traffic Trends, Top Merchant Consumers & Version Share
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6 text-xs">
        
        {/* TOP MERCHANT CONSUMERS TABLE */}
        <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-gold" />
            Top Merchant API Consumers by 24h Request Volume
          </h2>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-wider text-navy/50 dark:text-white/50">
                <th className="py-2.5 px-3">Merchant / Firm</th>
                <th className="py-2.5 px-3">Active Keys</th>
                <th className="py-2.5 px-3">24h Requests</th>
                <th className="py-2.5 px-3">Avg Latency</th>
                <th className="py-2.5 px-3 text-right">Subscription Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-semibold text-navy dark:text-white">
              {topConsumers.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                  <td className="py-3 px-3 font-black text-navy dark:text-gold">{c.merchant}</td>
                  <td className="py-3 px-3 font-mono text-[11px]">{c.keys}</td>
                  <td className="py-3 px-3 font-black">{c.calls24h}</td>
                  <td className="py-3 px-3 font-mono text-[11px]">{c.latency}</td>
                  <td className="py-3 px-3 text-right">
                    <span className="rounded-full bg-gold/20 text-navy dark:text-gold px-2.5 py-0.5 text-[10px] font-black">
                      {c.tier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* VERSION USAGE BREAKDOWN */}
        <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-1.5">
            <Cpu className="h-4 w-4 text-emerald-600" />
            API Version Usage Distribution
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {versionUsage.map((v, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-between">
                <div>
                  <p className="font-black text-navy dark:text-white">{v.version}</p>
                  <p className="text-[10px] text-navy/50 dark:text-white/50">Status: {v.status}</p>
                </div>
                <span className="text-2xl font-black text-gold-dark dark:text-gold">{v.share}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
