"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, CheckCircle2, XCircle, ChevronLeft } from "lucide-react";

export function AdminVerificationQueue() {
  const [requests, setRequests] = useState([
    { id: "VQ_501", name: "Chief Stankings Properties", type: "CAC Business Registration", value: "RC-1849204", submittedAt: "10:30 AM", status: "Pending Audit" },
    { id: "VQ_502", name: "Kalu Auto Dealership", type: "National NIN Verification", value: "NIN-84920194821", submittedAt: "11:15 AM", status: "Pending Audit" },
  ]);

  function handleApprove(id: string) {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }

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
              <ShieldCheck className="h-5 w-5 text-gold" />
              MERCHANT VERIFICATION OPERATIONS QUEUE
            </h1>
            <p className="text-[11px] font-semibold text-white/70">
              Audit NIN Identity, CAC Certificates & Showroom Proofs
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 space-y-4 text-xs">
        {requests.map((item) => (
          <div
            key={item.id}
            className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-[#031B4E] text-gold px-2.5 py-0.5 text-[10px] font-black uppercase">
                {item.id} · {item.type}
              </span>
              <span className="text-[10px] font-semibold text-navy/50 dark:text-white/50">{item.submittedAt}</span>
            </div>

            <div>
              <h2 className="text-sm font-black text-navy dark:text-white">{item.name}</h2>
              <p className="text-[11px] font-extrabold text-gold-dark dark:text-gold mt-0.5">
                Record Value: {item.value}
              </p>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-white/10 font-bold">
              <button
                type="button"
                onClick={() => handleApprove(item.id)}
                className="pressable rounded-2xl bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700 flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Approve Verification (+Score Boost)</span>
              </button>
              <button
                type="button"
                onClick={() => handleApprove(item.id)}
                className="pressable rounded-2xl bg-rose-600 text-white px-4 py-2 hover:bg-rose-700 flex items-center gap-1.5"
              >
                <XCircle className="h-4 w-4" />
                <span>Reject Application</span>
              </button>
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-navy border border-slate-100 dark:border-white/10 space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            <h3 className="text-base font-black text-navy dark:text-white">Verification Queue Empty!</h3>
            <p className="text-navy/60 dark:text-white/60">All NIN, CAC, and field showroom verification requests processed.</p>
          </div>
        )}
      </div>
    </div>
  );
}
