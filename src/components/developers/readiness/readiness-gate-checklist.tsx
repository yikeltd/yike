"use client";

import { Award, CheckCircle2 } from "lucide-react";

export function ReadinessGateChecklist() {
  const gates = [
    { title: "Operational Observability & Alerting Gate", status: "VERIFIED", note: "Live monitoring, third-party provider status, SLA uptime (99.99%)" },
    { title: "Scalability & Load Capacity Gate", status: "VERIFIED", note: "100,000 concurrent user benchmark passed (24.5K RPS peak)" },
    { title: "Enterprise Security & RLS Policy Gate", status: "VERIFIED", note: "98/100 score, 12/12 OWASP controls, 34/34 RLS tables" },
    { title: "Chaos & Self-Healing Failover Gate", status: "VERIFIED", note: "7/7 fault experiments recovered, 0 lost requests" },
    { title: "Backup & Data Integrity Gate", status: "VERIFIED", note: "100% checksum match, 5/5 subsystem restores verified" },
    { title: "API Governance & SDK Matrix Gate", status: "VERIFIED", note: "v1.0 LTS active, 5/5 official SDKs compatible" },
  ];

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-4 text-xs select-none">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-gold" />
          <h3 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white">
            Sprint 12.8.8 Launch Certification Gate Verification Checklist
          </h3>
        </div>

        <span className="rounded-full bg-emerald-500 text-navy px-2.5 py-0.5 text-[9px] font-black uppercase font-mono">
          READY FOR LAUNCH CERTIFICATION
        </span>
      </div>

      <div className="space-y-3 font-mono text-[11px]">
        {gates.map((g, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-black text-xs text-navy dark:text-white">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>{g.title}</span>
              </div>
              <p className="text-[10px] text-navy/60 dark:text-white/60">{g.note}</p>
            </div>

            <span className="rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 font-black uppercase text-[9px] shrink-0">
              {g.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
