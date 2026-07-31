"use client";

import { Wallet, ShieldCheck, DollarSign } from "lucide-react";

export function PartnerPayoutConfigConsole() {
  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <Wallet className="h-4 w-4 text-gold" />
            Partner Payout Settlement & Tax Withholding Configuration
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Automated Paystack/Korapay/M-Pesa split payouts and statutory Withholding Tax (WHT) deductions.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0">
          <ShieldCheck className="h-4 w-4" />
          <span>WHT COMPLIANT (5.0%)</span>
        </div>
      </div>

      {/* PAYOUT SPECS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
          <span className="text-[9px] uppercase font-bold text-navy/40 dark:text-white/40">Settlement Frequency</span>
          <p className="font-black text-navy dark:text-white text-xs">Instant Upon Milestones</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
          <span className="text-[9px] uppercase font-bold text-navy/40 dark:text-white/40">Statutory Tax Deductions</span>
          <p className="font-black text-gold text-xs flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" /> 5% Withholding Tax (WHT)
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
          <span className="text-[9px] uppercase font-bold text-navy/40 dark:text-white/40">Supported Gateways</span>
          <p className="font-black text-emerald-500 text-xs">Paystack · Korapay · M-Pesa</p>
        </div>
      </div>

    </div>
  );
}
