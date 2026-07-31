"use client";

import { DeveloperSubnav } from "./developer-subnav";
import { ApiVersionLifecycleCard } from "./apiversioning/api-version-lifecycle-card";
import { DeprecationManagerConsole } from "./apiversioning/deprecation-manager-console";
import { SdkCompatibilityMatrixTable } from "./apiversioning/sdk-compatibility-matrix-table";
import { GitBranch, ShieldCheck } from "lucide-react";

export function ApiVersioningDashboard() {
  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white py-8 px-4 sm:px-6 select-none">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* HEADER & SUBNAV */}
        <div className="space-y-4">
          <DeveloperSubnav />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-navy dark:text-white flex items-center gap-2">
                <GitBranch className="h-6 w-6 text-emerald-500" />
                API Version Manager & Lifecycle Governance Center
              </h1>
              <p className="text-xs text-navy/60 dark:text-white/60 mt-1">
                API release lifecycles (v1.0 Active, v2.0 Beta Preview), deprecation policies (Sunset-Date headers), and SDK compatibility matrix.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="h-4 w-4" />
              <span>V1.0 PRODUCTION LTS SUPPORTED</span>
            </div>
          </div>
        </div>

        {/* 1. API VERSION LIFECYCLE CARD */}
        <ApiVersionLifecycleCard />

        {/* 2. DEPRECATION MANAGER CONSOLE */}
        <DeprecationManagerConsole />

        {/* 3. SDK COMPATIBILITY MATRIX TABLE */}
        <SdkCompatibilityMatrixTable />

      </div>
    </div>
  );
}
