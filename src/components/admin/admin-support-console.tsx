"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, ChevronLeft } from "lucide-react";

export function AdminSupportConsole() {
  const [tickets] = useState([
    { id: "T_901", user: "Chief Buyer", issue: "Deposit receipt clarification for deal #ESC_9814", status: "Open Ticket", time: "15m ago" },
    { id: "T_902", name: "Lekki Agent", issue: "NIN verification document re-upload assistance", status: "In Review", time: "2h ago" },
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
              <MessageCircle className="h-5 w-5 text-gold" />
              CUSTOMER SUPPORT OPERATIONS DESK
            </h1>
            <p className="text-[11px] font-semibold text-white/70">
              Ticket Resolution, User Account Lookup & Internal Notes
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 space-y-4 text-xs">
        {tickets.map((t) => (
          <div
            key={t.id}
            className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-[#031B4E] text-gold px-2.5 py-0.5 text-[10px] font-black uppercase">
                {t.id}
              </span>
              <span className="text-[10px] font-semibold text-navy/50 dark:text-white/50">{t.time}</span>
            </div>

            <div>
              <h2 className="text-sm font-black text-navy dark:text-white">{t.issue}</h2>
              <p className="text-[11px] font-semibold text-navy/60 dark:text-white/60 mt-0.5">
                Submitted by: {t.user || t.name} · Status: {t.status}
              </p>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-white/10 font-bold">
              <button
                type="button"
                className="pressable rounded-2xl bg-[#031B4E] dark:bg-gold text-white dark:text-navy px-4 py-2 hover:opacity-90"
              >
                Reply & Resolve Ticket
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
