"use client";

import Link from "next/link";
import { FileText, ChevronLeft } from "lucide-react";

export function AdminAuditLogs() {
  const logs = [
    { id: "LOG_801", action: "NIN Verification Approved", staff: "Staff #402 (Compliance Officer)", target: "User: Chief Stankings Properties", timestamp: "10:30 AM Today" },
    { id: "LOG_802", action: "Escrow Milestone 1 Release Authorized", staff: "Staff #108 (Escrow Custody Lead)", target: "Deal #ESC_9814 (₦1.85M Deposit)", timestamp: "11:45 AM Today" },
    { id: "LOG_803", action: "Listing Moderation Flag Dismissed", staff: "Staff #215 (Moderator)", target: "Property #P1 (Lekki Phase 1)", timestamp: "01:15 PM Today" },
  ];

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
              <FileText className="h-5 w-5 text-gold" />
              IMMUTABLE SYSTEM AUDIT LOGS
            </h1>
            <p className="text-[11px] font-semibold text-white/70">
              Staff Activity History, Compliance Trail & Escrow Approvals
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 space-y-3 text-xs">
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-4 rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy shadow-md space-y-1"
          >
            <div className="flex items-center justify-between text-[10px] font-bold">
              <span className="rounded-md bg-[#031B4E] text-gold px-2 py-0.5 font-black uppercase">{log.id}</span>
              <span className="text-navy/50 dark:text-white/50">{log.timestamp}</span>
            </div>

            <h2 className="text-sm font-black text-navy dark:text-white">{log.action}</h2>
            <p className="text-[11px] font-semibold text-navy/70 dark:text-white/70">
              Performed by: {log.staff} · Target: {log.target}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
