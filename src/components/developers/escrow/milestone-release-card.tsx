"use client";

import { useState } from "react";
import type { EscrowMilestone } from "@/types/escrow-os";
import { releaseMilestoneSettlement } from "@/lib/escrow/escrow-engine";
import { CheckCircle2, Play, AlertTriangle } from "lucide-react";

export function MilestoneReleaseCard() {
  const [milestones, setMilestones] = useState<EscrowMilestone[]>([
    { id: "ms_1", milestoneIndex: 1, title: "Initial Deposit Lock (10%)", percent: 10, amount: 45000000, status: "approved", triggerRequirement: "Buyer Deposit Completed" },
    { id: "ms_2", milestoneIndex: 2, title: "Verified Field Inspection Clearance (40%)", percent: 40, amount: 180000000, status: "locked", triggerRequirement: "Property Inspection Passed" },
    { id: "ms_3", milestoneIndex: 3, title: "Legal Title Deed & Contract Clearance (40%)", percent: 40, amount: 180000000, status: "locked", triggerRequirement: "Lawyer Title Verified" },
    { id: "ms_4", milestoneIndex: 4, title: "Final Ownership Transfer & Settlement (10%)", percent: 10, amount: 45000000, status: "locked", triggerRequirement: "Buyer Deed Signing" },
  ]);

  const [auditLog, setAuditLog] = useState<string | null>(null);

  const handleRelease = (ms: EscrowMilestone) => {
    const result = releaseMilestoneSettlement(ms, "px_8819024_ng");
    if (result.success) {
      setMilestones((prev) =>
        prev.map((m) => (m.id === ms.id ? result.updatedMilestone : m))
      );
      setAuditLog(`Milestone ${ms.milestoneIndex} Released: ₦${ms.amount.toLocaleString()} NGN settled to Seller & Partner payout accounts via BTOS ledger.`);
    }
  };

  const handleDisputeFreeze = () => {
    setMilestones((prev) =>
      prev.map((m) => (m.status !== "released" ? { ...m, status: "disputed" } : m))
    );
    setAuditLog(`⚠️ DISPUTE FREEZE TRIGGERED: Locked all unreleased milestone funds immediately in Escrow Disputed Freeze Account.`);
  };

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-gold" />
            Multi-Stage Milestone Approval & Partial Release Engine
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Milestones release funds only when verified requirements are completed and approved.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDisputeFreeze}
          className="pressable rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 px-3.5 py-1.5 font-bold text-[10px] uppercase flex items-center gap-1 shrink-0"
        >
          <AlertTriangle className="h-3 w-3" /> Trigger Dispute Freeze
        </button>
      </div>

      {auditLog && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold">
          {auditLog}
        </div>
      )}

      {/* MILESTONES LIST */}
      <div className="space-y-3 font-mono text-[11px]">
        {milestones.map((ms) => {
          const isReleased = ms.status === "released";
          const isDisputed = ms.status === "disputed";

          return (
            <div
              key={ms.id}
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                isDisputed
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
                  : isReleased
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                  : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-black text-xs text-navy dark:text-white">
                  <span>Milestone {ms.milestoneIndex}: {ms.title}</span>
                  <span className="rounded-full bg-gold/20 text-gold px-2 py-0.2 text-[9px] uppercase">{ms.percent}%</span>
                </div>
                <p className="text-[10px] text-navy/60 dark:text-white/60">
                  Requirement: {ms.triggerRequirement} · Amount: ₦{ms.amount.toLocaleString()} NGN
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {!isReleased && !isDisputed && (
                  <button
                    type="button"
                    onClick={() => handleRelease(ms)}
                    className="pressable rounded-xl bg-[#031B4E] dark:bg-gold text-white dark:text-navy px-3 py-1 font-black text-[10px] uppercase flex items-center gap-1"
                  >
                    <Play className="h-3 w-3" /> Approve & Release
                  </button>
                )}

                <span
                  className={`rounded-full px-2.5 py-0.5 font-black uppercase text-[9px] ${
                    isReleased
                      ? "bg-emerald-500 text-navy"
                      : isDisputed
                      ? "bg-rose-500 text-white"
                      : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {ms.status.toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
