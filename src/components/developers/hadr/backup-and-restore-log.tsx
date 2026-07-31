"use client";

import type { BackupSnapshot } from "@/types/ha-dr";
import { Database, Lock, ShieldCheck } from "lucide-react";

export function BackupAndRestoreLog() {
  const snapshots: BackupSnapshot[] = [
    {
      id: "snap_99",
      name: "Hourly Encrypted DB Snapshot + WAL Logs",
      snapshotType: "database_full",
      sizeMb: 14200,
      createdAt: "2026-07-31T03:00:00.000Z",
      encrypted: true,
      geoReplicated: true,
      status: "verified",
    },
    {
      id: "snap_98",
      name: "Media Asset Storage Mirror (AES-256)",
      snapshotType: "media_storage",
      sizeMb: 85400,
      createdAt: "2026-07-31T00:00:00.000Z",
      encrypted: true,
      geoReplicated: true,
      status: "verified",
    },
  ];

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-4 text-xs select-none">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-gold" />
          <h3 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white">
            Automated Encrypted Snapshots & Point-In-Time WAL Logs
          </h3>
        </div>

        <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[9px] font-black uppercase font-mono">
          Geo-Replication Sync: ACTIVE
        </span>
      </div>

      <div className="space-y-3 font-mono text-[11px]">
        {snapshots.map((snap) => (
          <div
            key={snap.id}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-black text-xs text-navy dark:text-white">
                <Lock className="h-3.5 w-3.5 text-purple-600" />
                <span>{snap.name}</span>
              </div>
              <p className="text-[10px] text-navy/60 dark:text-white/60">
                Size: {(snap.sizeMb / 1024).toFixed(2)} GB · Encrypted AES-256 · Geo-Replicated across 3 Availability Zones
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="rounded-full bg-emerald-500 text-navy px-2.5 py-0.5 font-black uppercase text-[9px] flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                {snap.status.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
