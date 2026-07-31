"use client";

import { useState } from "react";
import type { TraceRecord } from "@/types/observability";
import { Search, Copy, Check, Clock, Layers } from "lucide-react";

export function TraceExplorer() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const traces: TraceRecord[] = [
    {
      traceId: "trace_01J8K9P8410294",
      requestId: "req_01J8K8X7E6W102",
      timestamp: "2026-07-31T02:44:00.120Z",
      method: "POST",
      path: "/api/v1/escrow/ESC_9814/fund",
      statusCode: 200,
      totalDurationMs: 84,
      userRole: "Merchant (Lekki Homes)",
      spans: [
        { id: "span_1", service: "Next.js App Router Proxy", operation: "HTTP POST /api/v1/escrow/ESC_9814/fund", durationMs: 84, status: "ok", startTimeOffsetMs: 0 },
        { id: "span_2", parentId: "span_1", service: "Auth Middleware", operation: "Bearer Token Validation & Rate Limit Check", durationMs: 8, status: "ok", startTimeOffsetMs: 2 },
        { id: "span_3", parentId: "span_1", service: "Supabase DB Query", operation: "SELECT * FROM escrow_deals WHERE id = 'ESC_9814'", durationMs: 24, status: "ok", startTimeOffsetMs: 12 },
        { id: "span_4", parentId: "span_1", service: "SafeHaven Custody Gateway", operation: "POST /v1/virtual-transfer/lock-custody", durationMs: 38, status: "ok", startTimeOffsetMs: 38 },
        { id: "span_5", parentId: "span_1", service: "Webhook Dispatcher Queue", operation: "ENQUEUE escrow.milestone_funded topic", durationMs: 12, status: "ok", startTimeOffsetMs: 72 },
      ],
    },
    {
      traceId: "trace_01J8K9P8499201",
      requestId: "req_01J8K8X7E99281",
      timestamp: "2026-07-31T02:42:15.802Z",
      method: "GET",
      path: "/api/v1/listings?category=property&city=Lagos",
      statusCode: 200,
      totalDurationMs: 32,
      userRole: "Public Buyer",
      spans: [
        { id: "span_1", service: "Next.js App Router Proxy", operation: "HTTP GET /api/v1/listings", durationMs: 32, status: "ok", startTimeOffsetMs: 0 },
        { id: "span_2", parentId: "span_1", service: "Supabase DB Query", operation: "SELECT * FROM listings WHERE category='property' AND city='Lagos'", durationMs: 18, status: "ok", startTimeOffsetMs: 4 },
        { id: "span_3", parentId: "span_1", service: "Trust Passport Cache", operation: "MGET trust_scores:[USR_8810, USR_9011]", durationMs: 8, status: "ok", startTimeOffsetMs: 22 },
      ],
    },
  ];

  const [selectedTrace, setSelectedTrace] = useState<TraceRecord>(traces[0]);

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-gold" />
            Distributed Trace Explorer & Parent/Child Spans
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Inspect end-to-end request latency waterfalls, database queries, and external gateway dependencies.
          </p>
        </div>

        {/* SEARCH BY CORRELATION ID */}
        <div className="relative shrink-0">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-navy/40 dark:text-white/40" />
          <input
            type="text"
            placeholder="Search by Trace ID / Request ID..."
            className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-[11px] font-mono w-64 focus:outline-none focus:border-gold"
          />
        </div>
      </div>

      {/* TRACE SELECTOR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {traces.map((tr) => (
          <button
            key={tr.traceId}
            type="button"
            onClick={() => setSelectedTrace(tr)}
            className={`p-4 rounded-2xl border text-left transition-all space-y-2 ${
              selectedTrace.traceId === tr.traceId
                ? "border-gold bg-gold/10 text-navy dark:text-white font-black shadow-md"
                : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"
            }`}
          >
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="font-black text-navy dark:text-gold">{tr.method} {tr.path}</span>
              <span className="rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[9px] font-black">
                {tr.statusCode} OK ({tr.totalDurationMs}ms)
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-navy/60 dark:text-white/60 font-mono">
              <span>Req ID: {tr.requestId.slice(0, 16)}...</span>
              <span>Spans: {tr.spans.length}</span>
            </div>
          </button>
        ))}
      </div>

      {/* DETAILED SPAN WATERFALL VISUALIZATION */}
      <div className="rounded-2xl bg-[#031B4E] text-white p-5 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="space-y-0.5">
            <span className="font-mono text-xs font-black text-gold block">
              Trace: {selectedTrace.traceId}
            </span>
            <div className="flex items-center gap-3 text-[10px] font-mono text-white/70">
              <span>Request ID: {selectedTrace.requestId}</span>
              <button type="button" onClick={() => handleCopy(selectedTrace.requestId)} className="p-0.5">
                {copiedId === selectedTrace.requestId ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono font-bold">
            <Clock className="h-3.5 w-3.5 text-gold" />
            <span>Total Latency: {selectedTrace.totalDurationMs}ms</span>
          </div>
        </div>

        {/* WATERFALL BARS */}
        <div className="space-y-3 pt-2">
          {selectedTrace.spans.map((span) => {
            const widthPct = Math.max(10, (span.durationMs / selectedTrace.totalDurationMs) * 100);
            const offsetPct = (span.startTimeOffsetMs / selectedTrace.totalDurationMs) * 100;

            return (
              <div key={span.id} className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="font-bold text-white/90">{span.service} · {span.operation}</span>
                  <span className="text-emerald-400 font-bold">{span.durationMs}ms</span>
                </div>

                <div className="relative h-3 w-full rounded-full bg-black/50 overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-gold to-emerald-400"
                    style={{ left: `${offsetPct}%`, width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
