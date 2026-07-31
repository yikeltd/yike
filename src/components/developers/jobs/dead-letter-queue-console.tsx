"use client";

import { useState } from "react";
import type { FailedJob } from "@/types/job-processing";
import { AlertCircle, RefreshCw, CheckCircle2, Bug } from "lucide-react";

export function DeadLetterQueueConsole() {
  const [failedJobs, setFailedJobs] = useState<FailedJob[]>([
    {
      id: "fj_101",
      jobId: "job_media_849102",
      queue: "media-processing",
      timestamp: "2026-07-31T03:22:10.000Z",
      errorReason: "HTTP 504 Gateway Timeout while downloading source image asset from remote S3 bucket",
      stackTrace: "Error: Timeout 15000ms exceeded\n  at FetchPipeline.downloadAsset (src/lib/media/pipeline.ts:42)\n  at JobWorker.process (src/lib/queue/worker.ts:118)",
      retryCount: 3,
      maxRetries: 3,
    },
    {
      id: "fj_102",
      jobId: "job_wh_991820",
      queue: "webhook-retries",
      timestamp: "2026-07-31T02:50:45.000Z",
      errorReason: "Signature verification failed on remote webhook receiver (HTTP 401 Unauthorized)",
      stackTrace: "Error: HTTP 401 Unauthorized\n  at WebhookDispatcher.postPayload (src/lib/webhooks/dispatcher.ts:88)\n  at JobWorker.process (src/lib/queue/worker.ts:118)",
      retryCount: 4,
      maxRetries: 4,
    },
  ]);

  const [requeueingId, setRequeueingId] = useState<string | null>(null);
  const [requeueSuccess, setRequeueSuccess] = useState<string | null>(null);

  function handleRequeue(id: string) {
    setRequeueingId(id);
    setRequeueSuccess(null);

    setTimeout(() => {
      setFailedJobs(failedJobs.filter((j) => j.id !== id));
      setRequeueingId(null);
      setRequeueSuccess(`Job ${id} successfully re-queued into active worker topic.`);
      setTimeout(() => setRequeueSuccess(null), 3000);
    }, 800);
  }

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-500" />
            Dead-Letter Queue & Failed Job Re-Queue Console
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Inspect exhausted background jobs, view exception stack traces, and trigger manual re-queues.
          </p>
        </div>

        <span className="rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2.5 py-0.5 text-[9px] font-black uppercase">
          {failedJobs.length} Dead-Letter Jobs
        </span>
      </div>

      {requeueSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{requeueSuccess}</span>
        </div>
      )}

      {/* FAILED JOBS LIST */}
      <div className="space-y-4">
        {failedJobs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 text-navy/50 dark:text-white/50">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
            <p className="font-black text-sm">Dead-Letter Queue is Empty!</p>
            <p className="text-xs">All background worker jobs are executing cleanly.</p>
          </div>
        ) : (
          failedJobs.map((job) => (
            <div
              key={job.id}
              className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
                <div className="space-y-0.5 font-mono text-[11px]">
                  <span className="font-black text-navy dark:text-gold text-xs block">{job.jobId}</span>
                  <span className="text-navy/50 dark:text-white/50 text-[10px]">Queue: {job.queue}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 text-[9px] font-black font-mono">
                    Retries Exhausted ({job.retryCount}/{job.maxRetries})
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRequeue(job.id)}
                    disabled={requeueingId === job.id}
                    className="pressable rounded-xl bg-gold text-navy px-3.5 py-1.5 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                  >
                    {requeueingId === job.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    <span>Re-Queue Job</span>
                  </button>
                </div>
              </div>

              {/* ERROR REASON & STACK TRACE */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 leading-relaxed">
                  Reason: {job.errorReason}
                </p>

                <div className="p-3 rounded-xl bg-[#031B4E] text-emerald-400 font-mono text-[10px] space-y-1 overflow-x-auto">
                  <span className="text-gold font-bold block flex items-center gap-1">
                    <Bug className="h-3 w-3" /> Stack Trace:
                  </span>
                  <pre className="whitespace-pre-wrap">{job.stackTrace}</pre>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
