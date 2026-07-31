"use client";

import { Database, ShieldCheck, CheckCircle2 } from "lucide-react";

export function EvidenceStorageMirrorCard() {
  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <Database className="h-4 w-4 text-gold" />
            Active-Active Multi-Region S3 Storage Mirror
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Cross-region object replication with immutable S3 Object Lock compliance mode enabled.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0">
          <ShieldCheck className="h-4 w-4" />
          <span>S3 REPLICATION ACTIVE</span>
        </div>
      </div>

      {/* REGION STATUS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-navy/40 dark:text-white/40 uppercase">Primary Region</span>
            <span className="rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.2 text-[9px] uppercase font-bold">ONLINE</span>
          </div>
          <h3 className="font-black text-sm text-navy dark:text-white">Lagos `LOS-01` (Primary S3 Bucket)</h3>
          <p className="text-[10px] text-navy/60 dark:text-white/60">URI: `s3://yike-evidence-los-01/` · Latency: 8ms · Object Lock: COMPLIANCE Mode</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-navy/40 dark:text-white/40 uppercase">Backup Mirror Region</span>
            <span className="rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.2 text-[9px] uppercase font-bold">SYNCHRONIZED</span>
          </div>
          <h3 className="font-black text-sm text-navy dark:text-white">London `LHR-01` (Backup Mirror Bucket)</h3>
          <p className="text-[10px] text-navy/60 dark:text-white/60">URI: `s3://yike-evidence-lhr-01/` · Sync Delay: &lt;1.2s · Checksum: 100% Match</p>
        </div>
      </div>

      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-mono text-[10px] font-bold">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        <span>AWS S3 OBJECT LOCK ACTIVE — WORM (WRITE-ONCE-READ-MANY) COMPLIANCE MODE VERIFIED</span>
      </div>

    </div>
  );
}
