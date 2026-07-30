"use client";

import { useState } from "react";
import type { NegotiationAggregate, NegotiationSummary } from "@/lib/deal-room/negotiation/types";
import {
  DollarSign,
  TrendingDown,
  Clock,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type Props = {
  summary: NegotiationSummary;
  negotiation?: NegotiationAggregate;
  onAccept?: () => void;
  onCounter?: () => void;
};

export function NegotiationSummaryPanel({ summary, negotiation, onAccept, onCounter }: Props) {
  const [showHistory, setShowHistory] = useState(false);

  const formattedCurrent = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(summary.currentAmount);

  const formattedOriginal = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(summary.originalAskingPrice);

  const formattedDiff = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Math.abs(summary.differenceAmount));

  return (
    <div className="w-full rounded-3xl border border-amber-300 bg-gradient-to-r from-[#031B4E] via-[#07142B] to-[#031B4E] text-white p-5 shadow-xl select-none space-y-4">
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F59E0B]/20 text-[#F59E0B]">
            <DollarSign className="h-4 w-4 text-[#F59E0B]" />
          </span>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#F59E0B]">
              Active Negotiation Summary
            </h3>
            <p className="text-[11px] text-slate-300 font-medium">
              Version {summary.totalOffersExchanged} • Status:{" "}
              <span className="capitalize text-white font-bold">{summary.currentStatus}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/20 transition-all self-start sm:self-auto min-h-[36px]"
        >
          <History className="h-3.5 w-3.5 text-[#F59E0B]" />
          <span>History ({summary.totalOffersExchanged})</span>
          {showHistory ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* PRICE METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
          <span className="text-[10px] font-bold uppercase text-slate-400">Current Offer</span>
          <p className="text-base md:text-lg font-black text-[#F59E0B]">{formattedCurrent}</p>
        </div>

        <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
          <span className="text-[10px] font-bold uppercase text-slate-400">Original Asking</span>
          <p className="text-sm md:text-base font-bold text-slate-300 line-through">{formattedOriginal}</p>
        </div>

        <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
          <span className="text-[10px] font-bold uppercase text-slate-400">Difference</span>
          <p className="text-sm md:text-base font-bold text-emerald-400 flex items-center gap-1">
            <TrendingDown className="h-3.5 w-3.5" />
            <span>-{formattedDiff} ({summary.percentageDifference}%)</span>
          </p>
        </div>

        <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
          <span className="text-[10px] font-bold uppercase text-slate-400">Offer Expiry</span>
          <p className="text-xs font-bold text-slate-200 flex items-center gap-1 mt-0.5">
            <Clock className="h-3.5 w-3.5 text-[#F59E0B]" />
            <span>48 Hours</span>
          </p>
        </div>
      </div>

      {/* IMMUTABLE VERSION HISTORY MODAL / EXPANDABLE DRAWER */}
      {showHistory && negotiation && (
        <div className="rounded-2xl bg-slate-900/90 p-4 border border-white/15 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 className="text-xs font-black uppercase text-[#F59E0B]">Immutable Revision History</h4>
            <span className="text-[10px] text-slate-400">Git-Style Versioning</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {negotiation.versions.map((ver) => (
              <div
                key={ver.versionNumber}
                className="flex items-center justify-between rounded-xl bg-white/5 p-2.5 border border-white/10 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-[#F59E0B]/20 px-2 py-0.5 text-[10px] font-black text-[#F59E0B]">
                    v{ver.versionNumber}
                  </span>
                  <span className="font-bold text-white">
                    ₦{ver.amount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize">({ver.offeredRole})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">
                    {new Date(ver.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold capitalize text-slate-200">
                    {ver.negotiationStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTION BAR */}
      {summary.currentStatus !== "accepted" && (
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onAccept}
            className="pressable flex-1 rounded-2xl bg-[#F59E0B] py-2.5 text-xs md:text-sm font-black text-[#031B4E] shadow-md hover:bg-amber-400 min-h-[44px]"
          >
            Accept Agreed Price (₦{Number(summary.currentAmount).toLocaleString()})
          </button>
          <button
            type="button"
            onClick={onCounter}
            className="pressable flex-1 rounded-2xl border border-white/20 bg-white/10 py-2.5 text-xs md:text-sm font-bold text-white hover:bg-white/20 min-h-[44px]"
          >
            Counter Offer
          </button>
        </div>
      )}
    </div>
  );
}
