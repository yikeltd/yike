"use client";

import type { SystemHealthMetric, ThirdPartyServiceStatus } from "@/types/production-monitoring";
import { Cpu, Activity, CheckCircle2 } from "lucide-react";

export function LiveSystemHealth() {
  const infraMetrics: SystemHealthMetric[] = [
    { id: "m1", name: "CPU Utilization", category: "infrastructure", currentValue: "18.4%", threshold: "<80%", status: "healthy", unit: "%" },
    { id: "m2", name: "RAM Allocation", category: "infrastructure", currentValue: "4.2 GB / 16 GB", threshold: "<14 GB", status: "healthy", unit: "GB" },
    { id: "m3", name: "Redis Vector Cache", category: "cache", currentValue: "98.2% Hit Rate", threshold: ">90%", status: "healthy", unit: "%" },
    { id: "m4", name: "PostgreSQL Pool", category: "database", currentValue: "12 / 100 Active", threshold: "<80 Active", status: "healthy", unit: "conn" },
  ];

  const thirdPartyServices: ThirdPartyServiceStatus[] = [
    { id: "tp1", serviceName: "Paystack Gateway", category: "payments", status: "operational", latencyMs: 12, provider: "Paystack" },
    { id: "tp2", serviceName: "Korapay Gateway", category: "payments", status: "operational", latencyMs: 18, provider: "Korapay" },
    { id: "tp3", serviceName: "Sendchamp SMS Engine", category: "notifications", status: "operational", latencyMs: 45, provider: "Sendchamp" },
    { id: "tp4", serviceName: "Escrow Custody Vault", category: "escrow", status: "operational", latencyMs: 8, provider: "Stankings Escrow" },
  ];

  return (
    <div className="space-y-6 text-xs select-none">
      
      {/* CORE INFRASTRUCTURE METRICS */}
      <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <Cpu className="h-4 w-4 text-gold animate-pulse" />
            Core Infrastructure & Resource Allocation
          </h2>
          <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[9px] font-black uppercase font-mono">
            ALL NODE METRICS NOMINAL
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {infraMetrics.map((m) => (
            <div key={m.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
              <span className="text-[10px] font-black uppercase text-navy/40 dark:text-white/40 block">{m.name}</span>
              <p className="text-base font-black text-navy dark:text-white tracking-tight">{m.currentValue}</p>
              <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-2.5 w-2.5" />
                Target: {m.threshold}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* THIRD-PARTY GATEWAY HEALTH */}
      <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            Third-Party Gateway & API Integrations Status
          </h2>
          <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[9px] font-black uppercase font-mono">
            4 / 4 OPERATIONAL
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono text-[11px]">
          {thirdPartyServices.map((tp) => (
            <div key={tp.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
              <span className="text-[10px] font-sans font-black uppercase text-navy/40 dark:text-white/40 block">{tp.serviceName}</span>
              <div className="flex items-center justify-between pt-1">
                <span className="rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[9px] font-black uppercase">
                  {tp.status.toUpperCase()}
                </span>
                <span className="text-gold font-bold">{tp.latencyMs}ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
