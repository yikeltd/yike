"use client";

import { DeveloperSubnav } from "./developer-subnav";
import { AvailabilityZoneStatusCard } from "./hadr/availability-zone-status-card";
import { FailoverSimulatorConsole } from "./hadr/failover-simulator-console";
import { BackupAndRestoreLog } from "./hadr/backup-and-restore-log";
import { Server, ShieldCheck } from "lucide-react";

export function HaDrDashboard() {
  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white py-8 px-4 sm:px-6 select-none">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* HEADER & SUBNAV */}
        <div className="space-y-4">
          <DeveloperSubnav />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-navy dark:text-white flex items-center gap-2">
                <Server className="h-6 w-6 text-gold" />
                High Availability & Disaster Recovery Console
              </h1>
              <p className="text-xs text-navy/60 dark:text-white/60 mt-1">
                Multi-region failover, RTO (&lt;30s) and RPO (&lt;1s) metrics, automated backup verification, and DR drill simulation.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="h-4 w-4" />
              <span>99.99% UPTIME SLA (ZERO DATA LOSS)</span>
            </div>
          </div>
        </div>

        {/* 1. AVAILABILITY ZONE STATUS CARD */}
        <AvailabilityZoneStatusCard />

        {/* 2. FAILOVER SIMULATOR CONSOLE */}
        <FailoverSimulatorConsole />

        {/* 3. BACKUP AND RESTORE LOG */}
        <BackupAndRestoreLog />

      </div>
    </div>
  );
}
