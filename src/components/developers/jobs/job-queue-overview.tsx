"use client";

import type { JobQueue } from "@/types/job-processing";
import { Cpu, ShieldCheck } from "lucide-react";

export function JobQueueOverview() {
  const queues: JobQueue[] = [
    {
      id: "q_1",
      name: "Media Optimization Queue",
      queueTopic: "media-processing",
      activeCount: 3,
      waitingCount: 8,
      completedCount: 14290,
      failedCount: 2,
      throughput: "120 jobs/min",
      status: "active",
    },
    {
      id: "q_2",
      name: "Trust Score Recalculation",
      queueTopic: "trust-recalc",
      activeCount: 1,
      waitingCount: 2,
      completedCount: 8410,
      failedCount: 0,
      throughput: "45 jobs/min",
      status: "active",
    },
    {
      id: "q_3",
      name: "Notification & SMS Queue",
      queueTopic: "notifications",
      activeCount: 5,
      waitingCount: 14,
      completedCount: 42900,
      failedCount: 1,
      throughput: "310 jobs/min",
      status: "active",
    },
    {
      id: "q_4",
      name: "Webhook Dispatcher Queue",
      queueTopic: "webhook-retries",
      activeCount: 0,
      waitingCount: 1,
      completedCount: 12050,
      failedCount: 1,
      throughput: "15 jobs/min",
      status: "active",
    },
  ];

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <Cpu className="h-4 w-4 text-gold" />
            Asynchronous Background Job Queue Processors
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Active worker queue depths, execution throughput, and topic processing health.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          <span>ALL 4 QUEUE WORKERS ACTIVE (490 JOBS/MIN)</span>
        </div>
      </div>

      {/* QUEUE CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {queues.map((q) => (
          <div
            key={q.id}
            className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3 shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-black text-navy dark:text-gold text-xs block">{q.name}</span>
                <code className="text-[10px] font-mono text-navy/50 dark:text-white/50">{q.queueTopic}</code>
              </div>
              <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[9px] font-black uppercase flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {q.status}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-[10px] font-mono">
              <div className="p-2 rounded-xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-center">
                <span className="text-navy/40 dark:text-white/40 block text-[9px]">Active</span>
                <span className="font-black text-gold text-xs">{q.activeCount}</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-center">
                <span className="text-navy/40 dark:text-white/40 block text-[9px]">Waiting</span>
                <span className="font-black text-blue-600 dark:text-blue-400 text-xs">{q.waitingCount}</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-center">
                <span className="text-navy/40 dark:text-white/40 block text-[9px]">Completed</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">{q.completedCount.toLocaleString()}</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-center">
                <span className="text-navy/40 dark:text-white/40 block text-[9px]">Failed</span>
                <span className={`font-black text-xs ${q.failedCount > 0 ? "text-rose-500" : "text-navy/40 dark:text-white/40"}`}>
                  {q.failedCount}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-navy/60 dark:text-white/60 pt-1 font-mono">
              <span>Throughput: <strong className="text-emerald-600 dark:text-emerald-400">{q.throughput}</strong></span>
              <span className="text-navy/40 dark:text-white/40">Topic ID: {q.id}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
