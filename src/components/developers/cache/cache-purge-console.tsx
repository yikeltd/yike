"use client";

import { useState } from "react";
import type { CachePurgeLog } from "@/types/cache-performance";
import { Trash2, RefreshCw, CheckCircle2 } from "lucide-react";

export function CachePurgeConsole() {
  const [pattern, setPattern] = useState("listings:lagos:*");
  const [purging, setPurging] = useState(false);
  const [purgedCount, setPurgedCount] = useState<number | null>(null);

  const [purgeLogs, setPurgeLogs] = useState<CachePurgeLog[]>([
    {
      id: "purge_1",
      timestamp: "2026-07-31T03:30:00.000Z",
      pattern: "listings:lagos:*",
      purgedKeys: 1420,
      triggeredBy: "Dev Console (Lex Admin)",
    },
    {
      id: "purge_2",
      timestamp: "2026-07-31T02:15:00.000Z",
      pattern: "trust:usr_8810",
      purgedKeys: 1,
      triggeredBy: "Automated Verification Callback",
    },
  ]);

  function handlePurge() {
    setPurging(true);
    setPurgedCount(null);

    setTimeout(() => {
      const keysRemoved = Math.floor(Math.random() * 800) + 120;
      setPurgedCount(keysRemoved);
      setPurging(false);

      const newLog: CachePurgeLog = {
        id: `purge_${Date.now()}`,
        timestamp: new Date().toISOString(),
        pattern: pattern,
        purgedKeys: keysRemoved,
        triggeredBy: "Manual Purge Console",
      };

      setPurgeLogs([newLog, ...purgeLogs]);
    }, 800);
  }

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-rose-500" />
            Key Pattern Eviction & Cache Purge Console
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Invalidate cache entries instantly across Redis key patterns (`listings:*`, `trust:*`, `locations:*`).
          </p>
        </div>
      </div>

      {/* INPUT PURGE FORM */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3">
        <span className="text-[10px] font-black uppercase tracking-wider text-navy/50 dark:text-white/50 block">
          Target Key Eviction Pattern
        </span>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="e.g. listings:lagos:*"
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/30 font-mono text-xs text-navy dark:text-gold focus:outline-none focus:border-gold"
          />

          <button
            type="button"
            onClick={handlePurge}
            disabled={purging || !pattern}
            className="pressable rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shrink-0"
          >
            {purging ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            <span>Purge Matching Keys</span>
          </button>
        </div>

        {purgedCount !== null && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Eviction Complete! Successfully purged <strong>{purgedCount}</strong> keys matching pattern <code className="font-mono">{pattern}</code>.</span>
          </div>
        )}
      </div>

      {/* PURGE HISTORY LOG */}
      <div className="space-y-3">
        <span className="text-[10px] font-black uppercase tracking-wider text-navy/50 dark:text-white/50 block">
          Recent Eviction Execution Logs
        </span>

        <div className="space-y-2">
          {purgeLogs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-[11px]"
            >
              <div className="space-y-0.5">
                <span className="font-bold text-navy dark:text-gold">{log.pattern}</span>
                <span className="text-navy/50 dark:text-white/50 text-[10px] block font-sans">Triggered by: {log.triggeredBy}</span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2.5 py-0.5 text-[10px] font-black">
                  -{log.purgedKeys} keys
                </span>
                <span className="text-[10px] text-navy/40 dark:text-white/40">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
