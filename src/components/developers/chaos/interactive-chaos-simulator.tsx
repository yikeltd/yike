"use client";

import { useState } from "react";
import { Zap, ArrowRight } from "lucide-react";

export function InteractiveChaosSimulator() {
  const [isInjectingFault, setIsInjectingFault] = useState(false);

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-gold animate-bounce" />
            Interactive Fault Injection & Self-Healing Simulator
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Simulate real-world component crashes (Database, Redis, Worker) to test zero-downtime automated recovery.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsInjectingFault(!isInjectingFault)}
          className="pressable rounded-xl bg-[#031B4E] dark:bg-gold text-white dark:text-navy px-4 py-2 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shrink-0"
        >
          <span>{isInjectingFault ? "Reset Component Health" : "Inject Database Connection Fault"}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* FAULT PROGRESS DISPLAY */}
      {isInjectingFault && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 space-y-2 font-mono text-[11px]">
          <span className="font-black uppercase text-xs block">⚠️ FAULT INJECTED: PRIMARY POSTGRESQL POOL CRASH</span>
          <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
            <div className="bg-amber-500 h-2 rounded-full w-[95%] animate-pulse" />
          </div>
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span>Failover Target: Read-Replica Pool (eu-west-2a)</span>
            <span>Recovery Latency: 8s</span>
            <span>Lost Requests: 0</span>
          </div>
        </div>
      )}

    </div>
  );
}
