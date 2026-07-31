"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert, CheckCircle2, AlertTriangle, ChevronLeft } from "lucide-react";

export function AdminModerationConsole() {
  const [flaggedListings, setFlaggedListings] = useState([
    { id: "FL_101", title: "2024 Mercedes-Benz G-Wagon G63 (Extremely Low Price)", category: "Vehicle", reason: "Price anomaly (Listed at ₦12M vs ₦180M market value)", reportedBy: "Automated Fraud Scanner", date: "Today" },
    { id: "FL_102", title: "Luxury 6 Bedroom Mansion in Banana Island", category: "Property", reason: "Duplicate photos from external website", reportedBy: "User Report", date: "Yesterday" },
  ]);

  function handleAction(id: string) {
    setFlaggedListings((prev) => prev.filter((item) => item.id !== id));
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
              <ShieldAlert className="h-5 w-5 text-gold" />
              CONTENT MODERATION & FRAUD CONSOLE
            </h1>
            <p className="text-[11px] font-semibold text-white/70">
              Review Flagged Properties, Vehicles & Suspect Sellers
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 space-y-4 text-xs">
        {flaggedListings.map((item) => (
          <div
            key={item.id}
            className="rounded-3xl border border-rose-200 dark:border-rose-950 bg-white dark:bg-navy p-5 shadow-xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 px-2.5 py-0.5 text-[10px] font-black uppercase">
                {item.id} · {item.category}
              </span>
              <span className="text-[10px] font-semibold text-navy/50 dark:text-white/50">{item.date}</span>
            </div>

            <div>
              <h2 className="text-sm font-black text-navy dark:text-white">{item.title}</h2>
              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Reason: {item.reason}
              </p>
              <p className="text-[10px] text-navy/50 dark:text-white/50 mt-0.5">Reported by: {item.reportedBy}</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-white/10 font-bold">
              <button
                type="button"
                onClick={() => handleAction(item.id)}
                className="pressable rounded-2xl bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700"
              >
                Approve & Dismiss Flag
              </button>
              <button
                type="button"
                onClick={() => handleAction(item.id)}
                className="pressable rounded-2xl bg-amber-500 text-navy px-4 py-2 hover:bg-amber-600 font-black"
              >
                Request Seller Edits
              </button>
              <button
                type="button"
                onClick={() => handleAction(item.id)}
                className="pressable rounded-2xl bg-rose-600 text-white px-4 py-2 hover:bg-rose-700"
              >
                Reject & Delist Item
              </button>
            </div>
          </div>
        ))}

        {flaggedListings.length === 0 && (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-navy border border-slate-100 dark:border-white/10 space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            <h3 className="text-base font-black text-navy dark:text-white">Moderation Queue Clear!</h3>
            <p className="text-navy/60 dark:text-white/60">No pending flagged items or fraud alerts requiring staff review.</p>
          </div>
        )}
      </div>
    </div>
  );
}
