"use client";

import type { PaymentAdapterSpec } from "@/types/escrow-os";
import { CreditCard, ShieldCheck } from "lucide-react";

export function PaymentAdapterRegistryCard() {
  const adapters: PaymentAdapterSpec[] = [
    { adapterId: "paystack_ng", name: "Paystack Payment Gateway", countryCode: "NG", currency: "NGN", supportedMethods: ["Card", "Bank Transfer", "USSD"], status: "online", avgLatencyMs: 140 },
    { adapterId: "korapay_ng", name: "Korapay Disbursal Engine", countryCode: "NG", currency: "NGN", supportedMethods: ["Direct Payout", "Virtual Bank Acc"], status: "online", avgLatencyMs: 180 },
    { adapterId: "mpesa_ke", name: "Safaricom M-Pesa (Daraja API)", countryCode: "KE", currency: "KES", supportedMethods: ["STK Push", "C2B", "B2C Disbursal"], status: "online", avgLatencyMs: 95 },
    { adapterId: "mtn_momo_gh", name: "MTN Mobile Money", countryCode: "GH", currency: "GHS", supportedMethods: ["MoMo Pay", "Disbursal API"], status: "online", avgLatencyMs: 120 },
    { adapterId: "ozow_za", name: "Ozow Instant EFT", countryCode: "ZA", currency: "ZAR", supportedMethods: ["Instant EFT", "Capitec Pay"], status: "online", avgLatencyMs: 110 },
  ];

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gold" />
            Pan-African Payment Adapter Gateway Registry
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Country-specific settlement adapters (NG, GH, KE, ZA, RW) implementing unified `IPaymentAdapter`.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0">
          <ShieldCheck className="h-4 w-4" />
          <span>5 / 5 ADAPTERS ONLINE</span>
        </div>
      </div>

      {/* ADAPTERS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px]">
        {adapters.map((adp) => (
          <div
            key={adp.adapterId}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2 shadow-sm flex flex-col justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gold">{adp.countryCode} ({adp.currency})</span>
                <span className="rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.2 text-[9px] uppercase font-bold">
                  {adp.status.toUpperCase()}
                </span>
              </div>
              <h3 className="font-black text-xs text-navy dark:text-white">{adp.name}</h3>
              <p className="text-[10px] text-navy/60 dark:text-white/60">Methods: {adp.supportedMethods.join(" · ")}</p>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[10px]">
              <span className="text-navy/50 dark:text-white/50">Avg Latency</span>
              <span className="font-bold text-emerald-500">{adp.avgLatencyMs} ms</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
