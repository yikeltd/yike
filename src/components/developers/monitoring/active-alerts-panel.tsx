"use client";

import { useState } from "react";
import type { ActiveAlert } from "@/types/production-monitoring";
import { AlertCircle, Bell, ArrowRight, ShieldCheck } from "lucide-react";

export function ActiveAlertsPanel() {
  const [pagerEscalated, setPagerEscalated] = useState(false);

  const alerts: ActiveAlert[] = [
    {
      id: "alt_1",
      title: "Redis Vector Cache Eviction Rate Spike (<0.1%)",
      severity: "info",
      source: "redis-cache-zone-1",
      triggeredAt: "2026-07-31T03:50:00.000Z",
      acknowledged: true,
    },
  ];

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <Bell className="h-4 w-4 text-gold" />
            Active Alerts Panel & Pager Escalation Simulator
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Real-time alert queue with PagerDuty-style escalation triggers for on-call engineers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setPagerEscalated(!pagerEscalated)}
          className="pressable rounded-xl bg-[#031B4E] dark:bg-gold text-white dark:text-navy px-4 py-2 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shrink-0"
        >
          <span>{pagerEscalated ? "Silence Pager Escalation" : "Trigger Pager Escalation Test"}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* PAGER ESCALATION DISPLAY */}
      {pagerEscalated && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 space-y-2 font-mono text-[11px]">
          <span className="font-black uppercase text-xs block">📟 PAGERDUTY ON-CALL DUTY ESCALATED</span>
          <p>
            Triggered On-Call Lead Engineer notification for primary cluster <strong>LOS-01</strong>. Response SLA: <strong>&lt;5 mins</strong>.
          </p>
        </div>
      )}

      {/* ACTIVE ALERTS LIST */}
      <div className="space-y-2 font-mono text-[11px]">
        {alerts.map((alt) => (
          <div
            key={alt.id}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-black text-xs text-navy dark:text-white">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <span>{alt.title}</span>
              </div>
              <p className="text-[10px] text-navy/60 dark:text-white/60">Source: {alt.source} · Triggered: {new Date(alt.triggeredAt).toLocaleTimeString()}</p>
            </div>

            <span className="rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[9px] font-black uppercase flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              ACKNOWLEDGED
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}
