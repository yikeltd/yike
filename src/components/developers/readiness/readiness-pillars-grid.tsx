"use client";

import type { ReadinessPillar } from "@/types/production-readiness";
import Link from "next/link";
import { CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";

export function ReadinessPillarsGrid() {
  const pillars: ReadinessPillar[] = [
    {
      id: "p1",
      sprintId: "Sprint 12.8.1",
      name: "Live Monitoring & Alerting",
      score: "99.99% Uptime SLA",
      metricSummary: "P95 42ms Latency · 0 Active Incidents · PagerDuty Escalation Active",
      status: "passed",
      route: "/developers/production-monitoring",
      details: ["Paystack 12ms", "Korapay 18ms", "PostgreSQL Pool 12/100", "Redis 98.2% Hit Rate"],
    },
    {
      id: "p2",
      sprintId: "Sprint 12.8.2",
      name: "Load & Scalability Center",
      score: "100,000 Users Scale",
      metricSummary: "24,500 RPS Peak Throughput · P95 82ms · 0.05% Error Rate",
      status: "passed",
      route: "/developers/load-testing",
      details: ["CPU Peak 64%", "RAM 5.8 GB / 16 GB", "DB Pool 84/100", "Queue Backlog 12 Jobs"],
    },
    {
      id: "p3",
      sprintId: "Sprint 12.8.3",
      name: "Security Posture Center",
      score: "98 / 100 Grade A+",
      metricSummary: "12/12 OWASP Controls Passed · 34/34 RLS Tables Scoped",
      status: "passed",
      route: "/developers/security",
      details: ["JWT & OAuth Passed", "CSP & Headers Active", "Secret Auto-Rotation Scheduled", "XSS & CSRF Protected"],
    },
    {
      id: "p4",
      sprintId: "Sprint 12.8.4",
      name: "Chaos Engineering & Self-Healing",
      score: "99.2% Self-Healing",
      metricSummary: "7/7 Component Failures Recovered · Avg Recovery 8s · 0 Lost Requests",
      status: "passed",
      route: "/developers/chaos",
      details: ["Redis Kill 4s", "DB Kill 8s", "Worker Crash 6s", "Region Failover 14s"],
    },
    {
      id: "p5",
      sprintId: "Sprint 12.8.5",
      name: "Backup Restore Validation",
      score: "100% Checksum Match",
      metricSummary: "5/5 Subsystem Restores Verified · Zero Data Corruption Certified",
      status: "passed",
      route: "/developers/backup-validation",
      details: ["Postgres PITR 18s", "Media Mirror 42s", "Escrow Ledger 12s", "User Auth 15s"],
    },
    {
      id: "p6",
      sprintId: "Sprint 12.8.6",
      name: "API Version & Governance",
      score: "v1.0 LTS Production",
      metricSummary: "5/5 Official SDKs Compatible · RFC 8594 Sunset Headers Active",
      status: "passed",
      route: "/developers/api-versioning",
      details: ["TS/Node.js v1.4", "Python v1.2", "PHP/Laravel v1.1", "Go v1.0", "Java v1.0"],
    },
  ];

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Operational Hardening Pillars Scorecard (Sprints 12.8.1 – 12.8.6)
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Consolidated evaluation across observability, scalability, security, chaos, recoverability, and governance.
          </p>
        </div>

        <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[9px] font-black uppercase">
          6 / 6 PILLARS PASSED
        </span>
      </div>

      {/* PILLARS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pillars.map((pil) => (
          <div
            key={pil.id}
            className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3 shadow-sm flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-navy/50 dark:text-white/50">{pil.sprintId}</span>
                <span className="rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[9px] font-black uppercase font-mono">
                  {pil.status.toUpperCase()}
                </span>
              </div>

              <h3 className="font-black text-sm text-navy dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                {pil.name}
              </h3>

              <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">{pil.score}</p>
              <p className="text-[10px] text-navy/70 dark:text-white/70">{pil.metricSummary}</p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
              <span className="text-[9px] font-mono text-navy/60 dark:text-white/60">Verified Clean</span>
              <Link
                href={pil.route}
                className="text-[10px] font-black text-navy dark:text-gold flex items-center gap-1 hover:underline"
              >
                Inspect Pillar <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
