"use client";

import { useState } from "react";
import type { BtosEvent } from "@/types/btos";
import { processBtosEvent, executeSagaRollback } from "@/lib/btos/event-bus";
import { Zap, ShieldCheck, RefreshCw, Layers } from "lucide-react";

export function BtosEventStream() {
  const [events] = useState<BtosEvent[]>([
    { eventId: "evt_101", eventType: "PassportCreated.v1", version: "v1", passportId: "px_8819024_ng", publisher: "PassportDomain", timestamp: "2026-07-31T04:00:00.000Z", payload: { assetId: "prop_lk_90412" }, idempotencyKey: "idem_key_101", status: "processed", retryCount: 0 },
    { eventId: "evt_102", eventType: "InspectionScheduled.v2", version: "v2", passportId: "px_8819024_ng", publisher: "PartnerPlatform", timestamp: "2026-07-31T04:30:00.000Z", payload: { partnerId: "ptr_901" }, idempotencyKey: "idem_key_102", status: "processed", retryCount: 0 },
    { eventId: "evt_103", eventType: "EscrowOpened.v2", version: "v2", passportId: "px_8819024_ng", publisher: "EscrowOS", timestamp: "2026-07-31T05:00:00.000Z", payload: { targetAmount: 450000000 }, idempotencyKey: "idem_key_103", status: "processed", retryCount: 0 },
  ]);

  const [testLog, setTestLog] = useState<string | null>(null);

  const simulateDuplicateEvent = () => {
    const dupEvent = events[0];
    const result = processBtosEvent(dupEvent);
    setTestLog(`Idempotency Check: Duplicate event ${dupEvent.eventId} detected (Processed: ${result.processed}, Duplicate: ${result.duplicate})`);
  };

  const simulateSagaRollback = () => {
    const result = executeSagaRollback("px_8819024_ng", "PaymentGatewayTimeout");
    setTestLog(result.rollbackLog);
  };

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-gold animate-bounce" />
            BTOS Versioned Event Bus Stream & Idempotent Processor
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Real-time event stream viewer with mandatory schema versioning (`v1`/`v2`) and Saga rollback handlers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={simulateDuplicateEvent}
            className="pressable rounded-xl bg-slate-100 dark:bg-white/10 text-navy dark:text-white px-3 py-1.5 font-bold text-[10px] uppercase flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" /> Test Idempotency
          </button>
          <button
            type="button"
            onClick={simulateSagaRollback}
            className="pressable rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 px-3 py-1.5 font-bold text-[10px] uppercase flex items-center gap-1"
          >
            <Layers className="h-3 w-3" /> Test Saga Rollback
          </button>
        </div>
      </div>

      {testLog && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold">
          {testLog}
        </div>
      )}

      {/* EVENT STREAM CARDS */}
      <div className="space-y-3 font-mono text-[11px]">
        {events.map((evt) => (
          <div
            key={evt.eventId}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-black text-xs text-navy dark:text-white">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>{evt.eventType}</span>
                <span className="rounded-full bg-gold/20 text-gold px-2 py-0.2 text-[9px] uppercase">{evt.version}</span>
              </div>
              <p className="text-[10px] text-navy/60 dark:text-white/60">
                Publisher: {evt.publisher} · Passport ID: {evt.passportId} · Idempotency Key: {evt.idempotencyKey}
              </p>
            </div>

            <span className="rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 font-black uppercase text-[9px] shrink-0">
              {evt.status.toUpperCase()}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}
