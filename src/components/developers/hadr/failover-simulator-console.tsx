"use client";

import { useState } from "react";
import type { DisasterRecoveryDrill } from "@/types/ha-dr";
import { Zap, ArrowRight, ShieldCheck } from "lucide-react";

export function FailoverSimulatorConsole() {
  const [isFailoverActive, setIsFailoverActive] = useState(false);

  const drills: DisasterRecoveryDrill[] = [
    {
      id: "drill_1",
      drillName: "Simulated LOS-01 Primary Cloud Datacenter Outage",
      simulatedScenario: "DNS traffic rerouted to LHR-01 Hot-Standby via BGP Anycast",
      failoverTimeSeconds: 14,
      rpoAchievedMs: 12,
      status: "passed",
      executedAt: "2026-07-28T02:00:00.000Z",
    },
  ];

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-gold" />
            Automated Region Failover & Disaster Recovery Drill Simulator
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Test automated regional failover mechanisms and verify zero data loss recovery point objectives.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsFailoverActive(!isFailoverActive)}
          className="pressable rounded-xl bg-[#031B4E] dark:bg-gold text-white dark:text-navy px-4 py-2 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shrink-0"
        >
          <span>{isFailoverActive ? "Reset Primary Active" : "Simulate Regional Failover"}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* FAILOVER SIMULATOR DISPLAY */}
      {isFailoverActive && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 space-y-2 font-mono text-[11px]">
          <span className="font-black uppercase text-xs block">⚠️ REGIONAL FAILOVER SIMULATION ACTIVE</span>
          <p>
            Primary Region <strong>LOS-01 (Lagos)</strong> marked DOWN. Traffic automatically rerouted to Standby Region <strong>LHR-01 (London)</strong>.
          </p>
          <div className="flex items-center gap-4 pt-1 font-bold">
            <span>Failover Latency: 14s (Target: &lt;30s)</span>
            <span>Data Loss: 0 Bytes</span>
          </div>
        </div>
      )}

      {/* DRILL HISTORY TABLE */}
      <div className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-navy/50 dark:text-white/50 block">
          Recent Disaster Recovery Drill Audits:
        </span>

        {drills.map((d) => (
          <div
            key={d.id}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-[11px]"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-black text-xs text-navy dark:text-white">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>{d.drillName}</span>
              </div>
              <p className="text-[10px] text-navy/60 dark:text-white/60">{d.simulatedScenario}</p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <span>Failover Time: {d.failoverTimeSeconds}s</span>
              <span className="rounded-full bg-emerald-500 text-navy px-2.5 py-0.5 font-black uppercase text-[9px]">
                {d.status.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
