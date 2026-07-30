"use client";

import type { SettlementAggregate } from "@/lib/deal-room/settlement/types";
import {
  CreditCard,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  settlement: SettlementAggregate;
  onReleaseEscrow?: (settlementId: string) => void;
};

export function SettlementCenterPanel({ settlement, onReleaseEscrow }: Props) {
  const allConditionsMet = settlement.releaseConditions.every((c) => c.met);

  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-xl select-none space-y-4">
      {/* HEADER & BALANCE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase text-[#031B4E]">
                Enterprise Settlement Center
              </h3>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase",
                  settlement.settlementStatus === "released"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-blue-100 text-blue-800"
                )}
              >
                {settlement.settlementStatus}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Double-Entry Ledger & Multi-Party Escrow • Provider: {settlement.providerId}
            </p>
          </div>
        </div>

        {/* AMOUNT & ESCROW BADGE */}
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200/80 self-start sm:self-auto">
          <Lock className="h-5 w-5 text-[#F59E0B]" />
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Escrow Balance</span>
            <p className="text-base font-black text-[#031B4E] font-mono">
              {settlement.currency} {settlement.totalAmount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* MULTI-PARTY SPLIT ALLOCATION BREAKDOWN */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-black uppercase text-slate-400">Multi-Party Split Allocation</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {settlement.splits.map((split, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-[#031B4E]">
                <span className="capitalize">{split.purpose}</span>
                <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md text-[10px]">
                  {split.percentage}%
                </span>
              </div>
              <p className="text-sm font-black text-slate-900 font-mono">
                {settlement.currency} {split.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* AUTOMATED RELEASE RULE CHECKLIST */}
      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-[#031B4E]">
            Automated Escrow Release Rules
          </span>
          <span className="text-[10px] font-bold text-slate-500">
            {settlement.releaseConditions.filter((c) => c.met).length} of {settlement.releaseConditions.length} Met
          </span>
        </div>

        <div className="space-y-1.5">
          {settlement.releaseConditions.map((cond, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-medium text-slate-700">
                {cond.met ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                )}
                <span>{cond.condition}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{cond.notes}</span>
            </div>
          ))}
        </div>

        {/* ESCROW RELEASE BUTTON */}
        {settlement.settlementStatus !== "released" && onReleaseEscrow && (
          <div className="pt-2 border-t border-slate-200/80 flex justify-end">
            <button
              type="button"
              disabled={!allConditionsMet}
              onClick={() => onReleaseEscrow(settlement.id)}
              className={cn(
                "pressable flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black text-white shadow-xl transition-all min-h-[42px]",
                allConditionsMet
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-slate-300 cursor-not-allowed"
              )}
            >
              <Zap className="h-4 w-4" />
              <span>Disburse Escrow Funds</span>
            </button>
          </div>
        )}
      </div>

      {/* DOUBLE-ENTRY LEDGER TIMELINE */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-black uppercase text-slate-400">Double-Entry Ledger Audit Trail</h4>
        <div className="space-y-1.5">
          {settlement.ledgerEntries.map((ledg) => (
            <div
              key={ledg.id}
              className="flex items-center justify-between rounded-xl bg-slate-900 text-white p-2.5 text-xs font-mono"
            >
              <div className="flex items-center gap-2">
                {ledg.entryType === "debit" ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-red-400" />
                ) : (
                  <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-400" />
                )}
                <span className="uppercase text-slate-300">
                  {ledg.entryType}: {ledg.accountType}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-bold text-[#E4B547]">
                  {ledg.currency} {ledg.amount.toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-500">{ledg.referenceHash}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
