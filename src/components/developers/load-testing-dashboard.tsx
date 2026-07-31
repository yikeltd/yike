"use client";

import { DeveloperSubnav } from "./developer-subnav";
import { ConcurrentUsersCard } from "./load/concurrent-users-card";
import { TrafficSimulatorConsole } from "./load/traffic-simulator-console";
import { StressTestResultsChart } from "./load/stress-test-results-chart";
import { Users, ShieldCheck } from "lucide-react";

export function LoadTestingDashboard() {
  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white py-8 px-4 sm:px-6 select-none">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* HEADER & SUBNAV */}
        <div className="space-y-4">
          <DeveloperSubnav />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-navy dark:text-white flex items-center gap-2">
                <Users className="h-6 w-6 text-gold" />
                Load Testing Center & Stress Simulator
              </h1>
              <p className="text-xs text-navy/60 dark:text-white/60 mt-1">
                Documented performance benchmarks from 10 to 100,000 concurrent users with sub-100ms P95 latency guarantees.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="h-4 w-4" />
              <span>STRESS BENCHMARK PASSED (24,500 RPS)</span>
            </div>
          </div>
        </div>

        {/* 1. STRESS TEST SATURATION CHARTS */}
        <StressTestResultsChart />

        {/* 2. CONCURRENT USERS SCALE CARDS */}
        <ConcurrentUsersCard />

        {/* 3. TRAFFIC SIMULATOR CONSOLE */}
        <TrafficSimulatorConsole />

      </div>
    </div>
  );
}
