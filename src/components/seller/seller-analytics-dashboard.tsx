"use client";

import Link from "next/link";
import { BarChart3, TrendingUp, ChevronLeft } from "lucide-react";

export function SellerAnalyticsDashboard() {
  const metrics = [
    { label: "Total Inventory Views", value: "14,820", change: "+18.4% vs last month" },
    { label: "Listing Saves / Favorites", value: "3,240", change: "+24.1% vs last month" },
    { label: "Lead Conversion Rate", value: "8.6%", change: "+2.2% top tier" },
    { label: "Trust Score Health", value: "95 / 100", change: "Platinum Tier (Top 2%)" },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white pb-20 select-none">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-navy/10 dark:border-white/10 bg-[#031B4E] px-4 py-3 text-white shadow-md">
        <div className="flex items-center gap-2.5">
          <Link href="/seller" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xs font-black uppercase tracking-wider text-gold flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-gold" />
              SELLER ANALYTICS & PERFORMANCE CENTER
            </h1>
            <p className="text-[10px] font-semibold text-white/70">
              Listing Impressions, Conversion & Trust Metrics
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-3.5 pt-6 sm:px-6 space-y-6">
        
        {/* METRICS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {metrics.map((m, idx) => (
            <div
              key={idx}
              className="p-4 rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy shadow-md space-y-1"
            >
              <span className="text-[10px] font-black uppercase tracking-wider text-navy/50 dark:text-white/50 block">
                {m.label}
              </span>
              <p className="text-xl font-black text-navy dark:text-white">{m.value}</p>
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{m.change}</p>
            </div>
          ))}
        </div>

        {/* PERFORMANCE SUMMARY CARD */}
        <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-3 text-xs">
          <h3 className="text-sm font-black text-navy dark:text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gold" />
            Marketplace Conversion & Visibility Report
          </h3>
          <p className="text-navy/70 dark:text-white/70 leading-relaxed">
            Your listings perform 2.4x higher than market average due to active NIN identity verification and CAC business registration. Boost your 2022 Toyota Camry SE listing to reach featured homepage slots.
          </p>
        </div>

      </div>
    </div>
  );
}
