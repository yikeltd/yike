"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, ChevronLeft, Code2, Send } from "lucide-react";

export function ApiPlaygroundConsole() {
  const [endpoint, setEndpoint] = useState<"listings" | "escrow" | "trust">("listings");
  const [hasRun, setHasRun] = useState(false);

  const responses = {
    listings: {
      status: 200,
      data: [
        { id: "P_101", title: "5 Bed Fully Detached Duplex in Lekki Phase 1", price: 350000000, category: "property", verified: true },
        { id: "V_202", title: "2022 Toyota Camry SE (Tokunbo)", price: 18500000, category: "vehicle", verified: true },
      ],
    },
    escrow: {
      status: 200,
      data: {
        id: "ESC_9814",
        status: "milestone_funded",
        buyer: "Emeka O.",
        amount: 18500000,
        milestoneProgress: "3/7 Steps Completed",
      },
    },
    trust: {
      status: 200,
      data: {
        userId: "USR_8810",
        trustScore: 95,
        trustTier: "Gold Merchant Tier",
        verifications: ["NIN", "CAC_BUSINESS", "FIELD_INSPECTED"],
      },
    },
  };

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white pb-20 select-none">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-navy/10 dark:border-white/10 bg-[#031B4E] px-6 py-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <Link href="/developers" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider text-gold flex items-center gap-2">
              <Play className="h-5 w-5 text-gold" />
              INTERACTIVE OPENAPI API PLAYGROUND
            </h1>
            <p className="text-[11px] font-semibold text-white/70">
              Live Test Endpoints, Query Parameters & Response Payloads
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-xs">
        
        {/* LEFT: ENDPOINT SELECTOR & REQUEST BUILDER */}
        <div className="lg:col-span-5 rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white">
            1. Select API Endpoint
          </h2>

          <div className="space-y-2 font-bold">
            <button
              type="button"
              onClick={() => { setEndpoint("listings"); setHasRun(false); }}
              className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                endpoint === "listings" ? "border-gold bg-gold/10 text-navy dark:text-gold font-black shadow-sm" : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"
              }`}
            >
              <span className="font-mono text-[11px]">GET /api/v1/listings</span>
              <span className="rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 text-[9px]">GET</span>
            </button>

            <button
              type="button"
              onClick={() => { setEndpoint("escrow"); setHasRun(false); }}
              className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                endpoint === "escrow" ? "border-gold bg-gold/10 text-navy dark:text-gold font-black shadow-sm" : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"
              }`}
            >
              <span className="font-mono text-[11px]">GET /api/v1/escrow/ESC_9814</span>
              <span className="rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 text-[9px]">GET</span>
            </button>

            <button
              type="button"
              onClick={() => { setEndpoint("trust"); setHasRun(false); }}
              className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                endpoint === "trust" ? "border-gold bg-gold/10 text-navy dark:text-gold font-black shadow-sm" : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"
              }`}
            >
              <span className="font-mono text-[11px]">GET /api/v1/trust/USR_8810</span>
              <span className="rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 text-[9px]">GET</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setHasRun(true)}
            className="pressable w-full py-3 rounded-2xl bg-gold text-navy font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-gold-light shadow-md"
          >
            <Send className="h-4 w-4" />
            <span>Execute Request</span>
          </button>
        </div>

        {/* RIGHT: LIVE JSON RESPONSE VIEW */}
        <div className="lg:col-span-7 rounded-3xl border border-navy/10 dark:border-white/10 bg-[#031B4E] text-white p-5 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-gold flex items-center gap-1.5">
              <Code2 className="h-4 w-4" />
              Live JSON Response Payload
            </h2>
            {hasRun && (
              <span className="rounded-full bg-emerald-500 text-white px-2.5 py-0.5 text-[10px] font-black uppercase">
                200 OK (32ms)
              </span>
            )}
          </div>

          <pre className="p-4 rounded-2xl bg-black/50 border border-white/10 font-mono text-xs text-emerald-400 min-h-[220px] overflow-x-auto">
            <code>
              {hasRun
                ? JSON.stringify(responses[endpoint], null, 2)
                : "// Click 'Execute Request' to test live API response payload"}
            </code>
          </pre>
        </div>

      </div>
    </div>
  );
}
