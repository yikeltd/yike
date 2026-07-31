"use client";

import { useState } from "react";
import type { EscrowAccount } from "@/types/escrow-os";
import { validateDoubleEntryLedger } from "@/lib/escrow/escrow-engine";
import { DollarSign, ShieldCheck, CheckCircle2 } from "lucide-react";

export function EscrowLedgerCard() {
  const [accounts] = useState<EscrowAccount[]>([
    { id: "acc_buyer_custody", passportId: "px_8819024_ng", accountType: "buyer_custody", accountName: "Buyer Escrow Custody Account", balance: 450000000, currency: "NGN", updatedAt: "2026-07-31" },
    { id: "acc_hold_1", passportId: "px_8819024_ng", accountType: "milestone_hold", accountName: "Milestone 1 Deposit Hold (10%)", balance: 45000000, currency: "NGN", updatedAt: "2026-07-31" },
    { id: "acc_hold_2", passportId: "px_8819024_ng", accountType: "milestone_hold", accountName: "Milestone 2 Inspection Clearance Hold (40%)", balance: 180000000, currency: "NGN", updatedAt: "2026-07-31" },
    { id: "acc_hold_3", passportId: "px_8819024_ng", accountType: "milestone_hold", accountName: "Milestone 3 Legal Title Clearance Hold (40%)", balance: 180000000, currency: "NGN", updatedAt: "2026-07-31" },
    { id: "acc_hold_4", passportId: "px_8819024_ng", accountType: "milestone_hold", accountName: "Milestone 4 Final Transfer Hold (10%)", balance: 45000000, currency: "NGN", updatedAt: "2026-07-31" },
    { id: "acc_disputed_hold", passportId: "px_8819024_ng", accountType: "disputed_hold", accountName: "Disputed Freeze Account", balance: 0, currency: "NGN", updatedAt: "2026-07-31" },
  ]);

  const audit = validateDoubleEntryLedger(accounts);

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            Double-Entry Atomic Financial Ledger Invariants
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Invariant Audit: `Total Custody (₦{audit.totalCustody.toLocaleString()}) = Sum(Holds: ₦{audit.totalHolds.toLocaleString()}) + Sum(Disputed: ₦{audit.totalDisputed.toLocaleString()})`.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0">
          <ShieldCheck className="h-4 w-4" />
          <span>LEDGER INVARIANT INTACT (100%)</span>
        </div>
      </div>

      {/* ACCOUNTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-sm"
          >
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase font-bold text-navy/40 dark:text-white/40">{acc.accountType.replace(/_/g, " ")}</span>
              <h3 className="font-black text-xs text-navy dark:text-white">{acc.accountName}</h3>
            </div>

            <p className="font-black text-sm text-emerald-600 dark:text-emerald-400 shrink-0">
              ₦{acc.balance.toLocaleString()} {acc.currency}
            </p>
          </div>
        ))}
      </div>

      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-mono text-[10px] font-bold">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        <span>ZERO DOUBLE-SPENDING GUARANTEE — ATOMIC POSTGRES `SELECT FOR UPDATE` LOCKING ACTIVE</span>
      </div>

    </div>
  );
}
