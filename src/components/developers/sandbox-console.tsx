"use client";

import { useState } from "react";
import { DeveloperSubnav } from "./developer-subnav";
import { SandboxBanner } from "./sandbox/sandbox-banner";
import { TestTube, Wallet, UserCheck, RefreshCw, Send, Plus, Terminal } from "lucide-react";

export function SandboxConsole() {
  const [testBalance, setTestBalance] = useState(10000000);
  const [testRole, setTestRole] = useState<"buyer" | "merchant" | "verifier">("merchant");
  const [seededCount, setSeededCount] = useState(10);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  function handleAddTestFunds() {
    setTestBalance((prev) => prev + 10000000);
    setLastEvent(`faucet.funds_added: +₦10,000,000 added to test wallet balance.`);
  }

  function handleSeedListings() {
    setSeededCount((prev) => prev + 5);
    setLastEvent(`sandbox.listings_seeded: Created 5 mock property/vehicle listings.`);
  }

  function handleSimulateEscrow() {
    setLastEvent(`escrow.milestone_funded: Simulated deal ESC_MOCK_901 funded with ₦18,500,000.`);
  }

  function handleResetSandbox() {
    setTestBalance(10000000);
    setSeededCount(10);
    setLastEvent(`sandbox.reset: Restored default sandbox state.`);
  }

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white py-8 px-4 sm:px-6 select-none">
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* SUBNAV & BANNER */}
        <DeveloperSubnav />
        <SandboxBanner />

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-navy dark:text-white flex items-center gap-2">
              <TestTube className="h-6 w-6 text-gold" />
              Developer Sandbox Testing Console
            </h1>
            <p className="text-xs text-navy/60 dark:text-white/60 mt-1">
              Simulate API calls, seed mock property/vehicle listings, test escrow milestones, and trigger sandbox webhooks.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetSandbox}
            className="pressable rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 px-3.5 py-2 text-xs font-black flex items-center gap-1.5 hover:bg-rose-500/20"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset Sandbox</span>
          </button>
        </div>

        {/* CONTROLS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          {/* 1. TEST IDENTITY SWITCHER */}
          <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-lg space-y-3">
            <h2 className="font-black text-xs uppercase tracking-wider text-navy dark:text-white flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-gold" />
              1. Test Identity Role Switcher
            </h2>
            <p className="text-[11px] text-navy/60 dark:text-white/60">
              Select simulated user role for API requests.
            </p>

            <div className="space-y-1.5 font-bold">
              {(["merchant", "buyer", "verifier"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTestRole(r)}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all capitalize ${
                    testRole === r
                      ? "border-gold bg-gold/10 text-navy dark:text-gold font-black shadow-sm"
                      : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"
                  }`}
                >
                  <span>{r === "merchant" ? "Mock Merchant (Lekki Homes)" : r === "buyer" ? "Mock Buyer (Emeka O.)" : "Mock Verifier (Officer Dan)"}</span>
                  {testRole === r && <span className="text-[9px] bg-gold text-navy px-1.5 py-0.5 rounded font-black">ACTIVE</span>}
                </button>
              ))}
            </div>
          </div>

          {/* 2. TEST WALLET FAUCET */}
          <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-lg space-y-3">
            <h2 className="font-black text-xs uppercase tracking-wider text-navy dark:text-white flex items-center gap-1.5">
              <Wallet className="h-4 w-4 text-emerald-600" />
              2. Test Payment Faucet
            </h2>
            <p className="text-[11px] text-navy/60 dark:text-white/60">
              Mock balance for simulated escrow funding.
            </p>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
              <span className="text-[10px] font-black text-navy/50 dark:text-white/50 uppercase">Test Wallet Balance</span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                ₦{testBalance.toLocaleString()} NGN
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddTestFunds}
              className="pressable w-full py-2.5 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center gap-1.5 hover:bg-emerald-700 shadow-md"
            >
              <Plus className="h-4 w-4" />
              <span>Add +₦10,000,000 Test Funds</span>
            </button>
          </div>

          {/* 3. MOCK DATA SEEDERS */}
          <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-lg space-y-3">
            <h2 className="font-black text-xs uppercase tracking-wider text-navy dark:text-white flex items-center gap-1.5">
              <Send className="h-4 w-4 text-blue-600" />
              3. Mock Data Seeder & Workflow
            </h2>
            <p className="text-[11px] text-navy/60 dark:text-white/60">
              Current seeded mock listings: <span className="font-bold text-gold">{seededCount} listings</span>
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleSeedListings}
                className="pressable w-full py-2 rounded-xl bg-[#031B4E] text-gold font-black flex items-center justify-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Seed +5 Mock Listings</span>
              </button>

              <button
                type="button"
                onClick={handleSimulateEscrow}
                className="pressable w-full py-2 rounded-xl bg-gold text-navy font-black flex items-center justify-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Simulate Escrow Milestone</span>
              </button>
            </div>
          </div>

        </div>

        {/* SIMULATED WEBHOOK EVENT LOG */}
        <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-[#031B4E] text-white p-5 shadow-2xl space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-gold flex items-center gap-1.5">
              <Terminal className="h-4 w-4" />
              Live Sandbox Webhook Event Inspector
            </h2>
            <span className="rounded-full bg-emerald-500 text-white px-2.5 py-0.5 text-[10px] font-black uppercase">
              LISTENING (SANDBOX PORT 3000)
            </span>
          </div>

          <pre className="p-4 rounded-2xl bg-black/50 border border-white/10 font-mono text-xs text-emerald-400 min-h-[140px] overflow-x-auto">
            <code>
              {lastEvent
                ? `// Timestamp: ${new Date().toISOString()}\n${lastEvent}`
                : "// Trigger Sandbox controls above to inspect live simulated webhook payloads"}
            </code>
          </pre>
        </div>

      </div>
    </div>
  );
}
