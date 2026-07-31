"use client";

import Link from "next/link";
import { Code2, Webhook, Activity, ChevronLeft, Cpu } from "lucide-react";

export function AdminDeveloperGovernance() {
  const stats = [
    { label: "Total 24h API Calls", value: "148,290", sub: "Peak: 420 req / sec", icon: Activity, color: "bg-blue-500/10 text-blue-600" },
    { label: "Active API Bearer Keys", value: "84 Keys", sub: "52 Production · 32 Test", icon: Code2, color: "bg-gold/10 text-gold" },
    { label: "Webhook Delivery Rate", value: "99.8%", sub: "12,410 Webhook Events Sent", icon: Webhook, color: "bg-emerald-500/10 text-emerald-600" },
    { label: "Rate Limit Audit Spikes", value: "0 Throttled", sub: "Max Limit: 1,000 req/min", icon: Cpu, color: "bg-purple-500/10 text-purple-600" },
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
              <Code2 className="h-5 w-5 text-gold" />
              DEVELOPER PLATFORM & PARTNER GOVERNANCE
            </h1>
            <p className="text-[11px] font-semibold text-white/70">
              API Traffic Throughput, Webhook Success Rate & Partner Credential Audits
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        
        {/* KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy shadow-md space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-navy/50 dark:text-white/50">
                    {s.label}
                  </span>
                  <span className={`p-2.5 rounded-2xl ${s.color}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="text-2xl font-black text-navy dark:text-white tracking-tight">
                  {s.value}
                </p>
                <p className="text-[11px] font-semibold text-navy/60 dark:text-white/60">
                  {s.sub}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
