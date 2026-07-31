"use client";

import { useState } from "react";
import { Zap, ArrowRight } from "lucide-react";

export function TrafficSimulatorConsole() {
  const [isTestRunning, setIsTestRunning] = useState(false);

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-gold animate-bounce" />
            Interactive Traffic Spike & Stress Test Simulator
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Launch synthetic traffic surges (100,000 RPS surge) to evaluate auto-scaling and queue degradation boundaries.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsTestRunning(!isTestRunning)}
          className="pressable rounded-xl bg-[#031B4E] dark:bg-gold text-white dark:text-navy px-4 py-2 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shrink-0"
        >
          <span>{isTestRunning ? "Stop Traffic Test" : "Simulate Flash Spike (100K Users)"}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* SIMULATOR PROGRESS DISPLAY */}
      {isTestRunning && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 space-y-2 font-mono text-[11px]">
          <span className="font-black uppercase text-xs block">⚡ STRESS TEST IN PROGRESS: 100,000 SIMULATED USERS</span>
          <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-500 h-2 rounded-full w-[85%] animate-pulse" />
          </div>
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span>RPS: 24,500 / 25,000 Peak</span>
            <span>P95 Latency: 82ms</span>
            <span>DB Pool Saturation: 84/100</span>
          </div>
        </div>
      )}

    </div>
  );
}
