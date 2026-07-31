"use client";

import { DeveloperSubnav } from "./developer-subnav";
import { EscrowLedgerCard } from "./escrow/escrow-ledger-card";
import { MilestoneReleaseCard } from "./escrow/milestone-release-card";
import { PaymentAdapterRegistryCard } from "./escrow/payment-adapter-registry-card";
import { DollarSign, ShieldCheck } from "lucide-react";

export function EscrowDashboard() {
  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white py-8 px-4 sm:px-6 select-none">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* HEADER & SUBNAV */}
        <div className="space-y-4">
          <DeveloperSubnav />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-navy dark:text-white flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-emerald-500" />
                Escrow Operating System & Financial Settlement Engine
              </h1>
              <p className="text-xs text-navy/60 dark:text-white/60 mt-1">
                Atomic double-entry financial ledger, multi-stage milestone partial release engine, and Pan-African payment adapter gateway.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="h-4 w-4" />
              <span>ESCROW OS ACTIVE</span>
            </div>
          </div>
        </div>

        {/* 1. ESCROW LEDGER */}
        <EscrowLedgerCard />

        {/* 2. MILESTONE RELEASE */}
        <MilestoneReleaseCard />

        {/* 3. PAYMENT ADAPTER REGISTRY */}
        <PaymentAdapterRegistryCard />

      </div>
    </div>
  );
}
