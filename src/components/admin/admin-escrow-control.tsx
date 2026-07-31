"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, ChevronLeft } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export function AdminEscrowControl() {
  const [deals] = useState([
    { id: "ESC_9814", title: "2022 Toyota Camry SE", buyer: "Emeka O.", seller: "Stankings Auto", value: 18500000, milestone: "Physical Inspection (Step 3/7)", status: "Active Custody" },
    { id: "ESC_9810", title: "4 Bed Terrace Ikoyi", buyer: "Mrs. Folake A.", seller: "Chief Stankings Properties", value: 280000000, milestone: "Title Audit (Step 4/7)", status: "Active Custody" },
  ]);

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white pb-20 select-none">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-navy/10 dark:border-white/10 bg-[#031B4E] px-6 py-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <Link href="/lex/auth/overview" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider text-gold flex items-center gap-2">
              <Lock className="h-5 w-5 text-gold" />
              ESCROW CUSTODY OFFICER CONTROL DESK
            </h1>
            <p className="text-[11px] font-semibold text-white/70">
              Manual Milestone Releases, Dispute Freezes & Settlement Audits
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 space-y-4 text-xs">
        {deals.map((item) => (
          <div
            key={item.id}
            className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-[#031B4E] text-gold px-2.5 py-0.5 text-[10px] font-black uppercase">
                {item.id}
              </span>
              <span className="font-black text-gold-dark dark:text-gold text-base">{formatPrice(item.value)}</span>
            </div>

            <div>
              <h2 className="text-sm font-black text-navy dark:text-white">{item.title}</h2>
              <p className="text-[11px] font-semibold text-navy/60 dark:text-white/60 mt-0.5">
                Buyer: {item.buyer} · Seller: {item.seller} · Milestone: {item.milestone}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-white/10 font-bold">
              <Link
                href={`/escrow/${item.id}`}
                className="pressable rounded-2xl bg-[#031B4E] dark:bg-gold text-white dark:text-navy px-4 py-2 hover:opacity-90"
              >
                Inspect Workspace
              </Link>
              <button
                type="button"
                className="pressable rounded-2xl bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700"
              >
                Authorize Milestone Release
              </button>
              <button
                type="button"
                className="pressable rounded-2xl bg-rose-600 text-white px-4 py-2 hover:bg-rose-700"
              >
                Freeze Payout (Dispute Hold)
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
