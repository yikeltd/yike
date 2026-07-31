"use client";

import type { CertificationGate } from "@/types/launch-certification";
import { CheckCircle2, ShieldCheck } from "lucide-react";

export function CertificationGatesList() {
  const gates: CertificationGate[] = [
    { id: "g1", sprintId: "Sprint 12.1", name: "Observability & Distributed Tracing", status: "certified", score: "10/10 Approved", approver: "CTO Review Committee", approvedAt: "2026-07-25", commitHash: "8fa12b91" },
    { id: "g2", sprintId: "Sprint 12.2", name: "Redis Caching & Edge Performance", status: "certified", score: "10/10 Approved", approver: "CTO Review Committee", approvedAt: "2026-07-26", commitHash: "e4d7120a" },
    { id: "g3", sprintId: "Sprint 12.3", name: "Background Jobs & Event Processing", status: "certified", score: "10/10 Approved", approver: "CTO Review Committee", approvedAt: "2026-07-27", commitHash: "3b901e4a" },
    { id: "g4", sprintId: "Sprint 12.4", name: "AI Semantic Search Engine", status: "certified", score: "10/10 Approved", approver: "CTO Review Committee", approvedAt: "2026-07-28", commitHash: "2bfb569c" },
    { id: "g5", sprintId: "Sprint 12.5", name: "AI Recommendation Engine", status: "certified", score: "10/10 Approved", approver: "CTO Review Committee", approvedAt: "2026-07-29", commitHash: "1d492ecb" },
    { id: "g6", sprintId: "Sprint 12.6", name: "Fraud & Escrow Risk Intelligence", status: "certified", score: "10/10 Approved", approver: "CTO Review Committee", approvedAt: "2026-07-30", commitHash: "63f0bd49" },
    { id: "g7", sprintId: "Sprint 12.7", name: "High Availability & Disaster Recovery", status: "certified", score: "10/10 Approved", approver: "CTO Review Committee", approvedAt: "2026-07-30", commitHash: "02fb19e3" },
    { id: "g8", sprintId: "Sprint 12.8", name: "Production Hardening Program (12.8.1 - 12.8.7)", status: "certified", score: "10/10 Approved", approver: "CTO Review Committee", approvedAt: "2026-07-31", commitHash: "cde3389b" },
  ];

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            8-Point Release Gate Certification Audit Breakdown
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Formal architectural sign-off across all Sprint 12 ecosystem capabilities.
          </p>
        </div>

        <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[9px] font-black uppercase font-mono">
          8 / 8 GATES CERTIFIED
        </span>
      </div>

      {/* GATES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gates.map((gt) => (
          <div
            key={gt.id}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2 shadow-sm flex flex-col justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-navy/50 dark:text-white/50">{gt.sprintId}</span>
                <span className="rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[9px] font-black uppercase font-mono">
                  {gt.status.toUpperCase()}
                </span>
              </div>

              <h3 className="font-black text-xs text-navy dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                {gt.name}
              </h3>

              <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 font-mono">{gt.score}</p>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between font-mono text-[10px]">
              <span className="text-navy/60 dark:text-white/60">Approved: {gt.approvedAt}</span>
              <span className="text-gold font-bold">Commit: {gt.commitHash}</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
