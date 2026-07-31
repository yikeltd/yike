"use client";

import Link from "next/link";
import { DollarSign, Download, Lock, TrendingUp, ChevronLeft, Sparkles, Building2 } from "lucide-react";

export function AdminRevenueDashboard() {
  const revSummary = [
    { label: "Gross Merchandise Volume (GMV)", value: "₦1.84 Billion", sub: "Properties & Vehicles Transacted", icon: TrendingUp, color: "bg-blue-500/10 text-blue-600" },
    { label: "Platform Escrow Commission", value: "₦24.6 Million", sub: "1.5% - 2.5% Escrow Custody Fee", icon: Lock, color: "bg-emerald-500/10 text-emerald-600" },
    { label: "Subscription MRR", value: "₦8.4 Million", sub: "336 Active Pro & Enterprise Merchants", icon: Building2, color: "bg-purple-500/10 text-purple-600" },
    { label: "Listing Boosts & Promos", value: "₦4.2 Million", sub: "840 Boost Campaigns Activated", icon: Sparkles, color: "bg-amber-500/10 text-amber-600" },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white pb-20 select-none">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-navy/10 dark:border-white/10 bg-[#031B4E] px-6 py-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <Link href="/lex/auth/overview" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider text-gold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gold" />
              EXECUTIVE REVENUE & MONETIZATION DASHBOARD
            </h1>
            <p className="text-[11px] font-semibold text-white/70">
              Platform GMV, Escrow Fees, MRR & Tax Audit Exports
            </p>
          </div>
        </div>

        <button
          type="button"
          className="pressable flex items-center gap-1.5 rounded-2xl bg-gold text-navy px-3.5 py-1.5 text-xs font-black hover:bg-gold-light"
        >
          <Download className="h-4 w-4" />
          <span>Export Financial Statement (CSV)</span>
        </button>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        
        {/* SUMMARY METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {revSummary.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy shadow-md space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-navy/50 dark:text-white/50">
                    {item.label}
                  </span>
                  <span className={`p-2.5 rounded-2xl ${item.color}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="text-2xl font-black text-navy dark:text-white tracking-tight">
                  {item.value}
                </p>
                <p className="text-[11px] font-semibold text-navy/60 dark:text-white/60">
                  {item.sub}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
