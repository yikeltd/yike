"use client";

import Link from "next/link";
import { Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export function SellerTransactionsQueue() {
  const escrows = [
    { id: "ESC_9814", buyer: "Emeka O.", asset: "2022 Toyota Camry SE", type: "Vehicle", price: 18500000, step: "Physical Inspection (Step 3/7)", deposit: "10% Funded", action: "Confirm Inspection Date" },
    { id: "ESC_9810", buyer: "Mrs. Folake A.", asset: "4 Bed Terrace in Ikoyi", type: "Property", price: 280000000, step: "Title Audit (Step 4/7)", deposit: "40% Funded", action: "Upload Deed of Assignment" },
    { id: "ESC_9792", buyer: "Chief Kalu N.", asset: "5 Bed Duplex Lekki", type: "Property", price: 350000000, step: "Completed & Settled", deposit: "100% Settled", action: "View Payout Receipt" },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white pb-20 select-none">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-navy/10 dark:border-white/10 bg-[#031B4E] px-4 py-3 text-white shadow-md">
        <div className="flex items-center gap-2.5">
          <Link href="/seller" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xs font-black uppercase tracking-wider text-gold flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-gold" />
              MERCHANT ESCROW TRANSACTIONS QUEUE
            </h1>
            <p className="text-[10px] font-semibold text-white/70">
              Active Buyer Transactions & Payout Releases
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-3.5 pt-6 sm:px-6 space-y-4">
        {escrows.map((deal) => (
          <div
            key={deal.id}
            className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-[#031B4E] px-2 py-0.5 text-[10px] font-black uppercase text-gold">
                  {deal.id}
                </span>
                <span className="rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-bold">
                  {deal.deposit}
                </span>
              </div>
              <span className="font-black text-gold-dark dark:text-gold text-base">
                {formatPrice(deal.price)}
              </span>
            </div>

            <div>
              <h2 className="text-sm font-black text-navy dark:text-white">{deal.asset}</h2>
              <p className="text-[11px] font-semibold text-navy/60 dark:text-white/60 mt-0.5">
                Buyer: {deal.buyer} · Status: {deal.step}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/10">
              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                Action Required: {deal.action}
              </span>

              <Link
                href={`/escrow/${deal.id}`}
                className="pressable inline-flex items-center gap-1 rounded-2xl bg-[#031B4E] dark:bg-gold px-3.5 py-1.5 text-xs font-black text-white dark:text-navy hover:opacity-90"
              >
                <span>Open Workspace</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
