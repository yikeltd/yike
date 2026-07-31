"use client";

import type { CronJob } from "@/types/job-processing";
import { Calendar, CheckCircle2 } from "lucide-react";

export function CronScheduleConsole() {
  const cronJobs: CronJob[] = [
    {
      id: "cron_1",
      name: "Daily Database Read-Replica Indexing & Cleanup",
      cronExpression: "0 2 * * *",
      scheduleHuman: "Every day at 02:00 UTC",
      lastRun: "Jul 31, 2026 · 02:00 UTC",
      nextRun: "Aug 1, 2026 · 02:00 UTC",
      status: "healthy",
    },
    {
      id: "cron_2",
      name: "Expiring Merchant Listing Auto-Check & Alert",
      cronExpression: "*/5 * * * *",
      scheduleHuman: "Every 5 minutes",
      lastRun: "Jul 31, 2026 · 03:40 UTC",
      nextRun: "Jul 31, 2026 · 03:45 UTC",
      status: "healthy",
    },
    {
      id: "cron_3",
      name: "Weekly Seller CRM Summary & Lead Digest",
      cronExpression: "0 0 * * 0",
      scheduleHuman: "Every Sunday at midnight UTC",
      lastRun: "Jul 26, 2026 · 00:00 UTC",
      nextRun: "Aug 2, 2026 · 00:00 UTC",
      status: "healthy",
    },
  ];

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-4 text-xs select-none">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gold" />
          <h3 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white">
            Automated Standing Cron Schedules & Recurring Tasks
          </h3>
        </div>

        <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[9px] font-black uppercase">
          3 Active Cron Monitors
        </span>
      </div>

      <div className="space-y-3">
        {cronJobs.map((cron) => (
          <div
            key={cron.id}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-black text-sm text-navy dark:text-white">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{cron.name}</span>
              </div>
              <p className="text-[11px] text-navy/70 dark:text-white/70">
                Expression: <code className="font-mono text-gold font-bold bg-black/10 px-1 rounded">{cron.cronExpression}</code> · Schedule: {cron.scheduleHuman}
              </p>
            </div>

            <div className="flex items-center gap-4 text-[10px] font-mono shrink-0">
              <div>
                <span className="text-navy/40 dark:text-white/40 block">Last Run</span>
                <span className="text-navy dark:text-white">{cron.lastRun}</span>
              </div>
              <div>
                <span className="text-navy/40 dark:text-white/40 block">Next Run</span>
                <span className="text-gold font-bold">{cron.nextRun}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
