"use client";

import type { IncidentRecord } from "@/types/production-monitoring";
import { CheckCircle2, History } from "lucide-react";

export function IncidentTimeline() {
  const incidents: IncidentRecord[] = [
    {
      id: "inc_901",
      title: "Transient Webhook Dispatch Delay (Sendchamp SMS)",
      severity: "minor",
      impact: "Zero Data Loss · 45s SMS delivery delay",
      status: "resolved",
      resolvedAt: "2026-07-30T18:22:00.000Z",
      rootCause: "Upstream provider rate-limit throttle resolved via secondary SMS channel switch",
    },
  ];

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-4 text-xs select-none">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-gold" />
          <h3 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white">
            Incident Resolution Audit Trail & Timeline
          </h3>
        </div>

        <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[9px] font-black uppercase">
          0 Unresolved Incidents
        </span>
      </div>

      <div className="space-y-3 font-mono text-[11px]">
        {incidents.map((inc) => (
          <div
            key={inc.id}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-navy dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {inc.title}
              </span>
              <span className="rounded-full bg-emerald-500 text-navy px-2 py-0.5 font-black uppercase text-[9px]">
                {inc.status.toUpperCase()}
              </span>
            </div>

            <p className="text-[10px] text-navy/70 dark:text-white/70">
              Impact: {inc.impact} · Root Cause: {inc.rootCause}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
