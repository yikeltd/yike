"use client";

import { useState } from "react";
import type { TransactionPassport, TransactionPassportState } from "@/types/passport";
import { executeStateTransition } from "@/lib/passport/state-machine";
import { ShieldCheck, ArrowRight, GitCommit } from "lucide-react";

export function PassportExplorerCard() {
  const [passport, setPassport] = useState<TransactionPassport>({
    id: "px_8819024_ng",
    assetId: "prop_lk_90412",
    assetTitle: "Luxury 5-Bed Waterfront Villa in Ikoyi",
    assetCategory: "property",
    buyerId: "usr_buyer_901",
    sellerId: "usr_seller_402",
    countryCode: "NG",
    valuationAmount: 450000000,
    currency: "NGN",
    currentState: "INSPECTION",
    createdAt: "2026-07-31T04:00:00.000Z",
    updatedAt: "2026-07-31T06:00:00.000Z",
  });

  const [transitionLog, setTransitionLog] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const statesSequence: TransactionPassportState[] = [
    "DRAFT",
    "MATCHED",
    "NEGOTIATING",
    "INSPECTION",
    "LEGAL_REVIEW",
    "ESCROW",
    "SETTLEMENT",
    "TRANSFER",
    "COMPLETED",
  ];

  const handleTransition = (nextState: TransactionPassportState) => {
    setErrorMsg(null);
    const result = executeStateTransition(passport.currentState, nextState, "usr_cto_staff", "Developer Portal State Machine Execution");
    if (result.success) {
      setPassport((prev) => ({ ...prev, currentState: result.newState, updatedAt: new Date().toISOString() }));
      setTransitionLog((prev) => [
        `Transitioned from ${passport.currentState} ──► ${result.newState} at ${new Date().toLocaleTimeString()}`,
        ...prev,
      ]);
    } else {
      setErrorMsg(result.error || "Transition failed");
    }
  };

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-gold uppercase">Aggregate Root ID: {passport.id}</span>
          <h2 className="text-sm sm:text-base font-black text-navy dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            {passport.assetTitle}
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60">
            Valuation: ₦{passport.valuationAmount.toLocaleString()} NGN · Country: {passport.countryCode} · Category: {passport.assetCategory.toUpperCase()}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0">
          <GitCommit className="h-4 w-4" />
          <span>STATE: {passport.currentState}</span>
        </div>
      </div>

      {/* STATE MACHINE STEPPER VISUALIZER */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-navy/60 dark:text-white/60">
          Canonical Transaction State Machine
        </h3>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
          {statesSequence.map((st, idx) => {
            const isCurrent = passport.currentState === st;
            const isPassed = statesSequence.indexOf(passport.currentState) > idx;

            return (
              <button
                key={st}
                type="button"
                onClick={() => handleTransition(st)}
                className={`px-3 py-1.5 rounded-xl font-mono text-[10px] font-black shrink-0 transition-all border ${
                  isCurrent
                    ? "bg-gold text-navy border-gold shadow-md"
                    : isPassed
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-slate-100 dark:bg-white/5 text-navy/60 dark:text-white/60 border-slate-200 dark:border-white/10"
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>

        {errorMsg && (
          <p className="text-rose-600 dark:text-rose-400 text-[10px] font-mono font-bold bg-rose-500/10 p-2 rounded-xl border border-rose-500/30">
            ⚠️ {errorMsg}
          </p>
        )}
      </div>

      {/* TRANSITION LOG */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/10 font-mono text-[10px]">
        <span className="font-bold text-navy/60 dark:text-white/60 uppercase">Immutable Transition Audit Stream:</span>
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 max-h-32 overflow-y-auto space-y-1">
          {transitionLog.length === 0 ? (
            <p className="text-navy/40 dark:text-white/40 italic">Click any state step above to test canonical transition enforcement.</p>
          ) : (
            transitionLog.map((log, idx) => (
              <p key={idx} className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <ArrowRight className="h-3 w-3" /> {log}
              </p>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
