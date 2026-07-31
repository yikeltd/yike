"use client";

import type { AvailabilityZone } from "@/types/ha-dr";
import { Server, Activity, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function AvailabilityZoneStatusCard() {
  const zones: AvailabilityZone[] = [
    {
      id: "az_1",
      name: "LOS-01 Primary Cluster",
      regionCode: "af-south-1a",
      location: "Lagos, Nigeria (Hetzner Cloud)",
      type: "primary",
      status: "active",
      replicationLagMs: 0,
      rtoSeconds: 30,
      rpoSeconds: 1,
      uptimePercentage: "99.99%",
    },
    {
      id: "az_2",
      name: "LHR-01 Hot-Standby Replica",
      regionCode: "eu-west-2a",
      location: "London, UK (Hetzner Cloud)",
      type: "secondary",
      status: "standby",
      replicationLagMs: 42,
      rtoSeconds: 30,
      rpoSeconds: 1,
      uptimePercentage: "99.99%",
    },
  ];

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <Server className="h-4 w-4 text-gold" />
            Multi-Region Availability Zone Topology & Streaming Replication
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Active-Passive multi-region failover cluster with sub-second synchronous WAL streaming.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
          <Activity className="h-4 w-4 animate-pulse" />
          <span>REPLICATION LAG: 42ms (HEALTHY)</span>
        </div>
      </div>

      {/* ZONES CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {zones.map((az) => (
          <div
            key={az.id}
            className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3 shadow-md flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase font-mono",
                    az.type === "primary"
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-gold/20 text-navy dark:text-gold"
                  )}
                >
                  {az.type.toUpperCase()} REGION ({az.status.toUpperCase()})
                </span>
                <span className="font-mono text-[10px] text-navy/50 dark:text-white/50">{az.regionCode}</span>
              </div>

              <h3 className="font-black text-sm text-navy dark:text-white leading-snug">{az.name}</h3>
              <p className="text-[11px] text-navy/60 dark:text-white/60 font-medium">{az.location}</p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-white/10 grid grid-cols-3 gap-2 font-mono text-[10px]">
              <div>
                <span className="text-navy/40 dark:text-white/40 block text-[9px]">Uptime SLA:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{az.uptimePercentage}</span>
              </div>
              <div>
                <span className="text-navy/40 dark:text-white/40 block text-[9px]">Target RTO:</span>
                <span className="font-bold text-navy dark:text-white">&lt;{az.rtoSeconds}s</span>
              </div>
              <div>
                <span className="text-navy/40 dark:text-white/40 block text-[9px]">Replication Lag:</span>
                <span className="font-bold text-gold flex items-center gap-0.5">
                  <RefreshCw className="h-2.5 w-2.5" />
                  {az.replicationLagMs}ms
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
