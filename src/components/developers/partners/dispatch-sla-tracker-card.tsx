"use client";

import { useState } from "react";
import type { DispatchJob } from "@/types/partner-platform";
import { evaluateSlaBreach } from "@/lib/partners/dispatch-engine";
import { Clock, ShieldCheck, AlertTriangle, Play, MapPin } from "lucide-react";

export function DispatchSlaTrackerCard() {
  const [dispatches, setDispatches] = useState<DispatchJob[]>([
    { dispatchId: "dsp_401", passportId: "px_8819024_ng", partnerId: "ptr_901_ng", partnerName: "Apex Property Inspection Ltd", discipline: "property_inspector", region: "Lagos", status: "in_progress", dispatchedAt: "2026-07-31T06:15:00.000Z", slaMinutes: 30 },
    { dispatchId: "dsp_402", passportId: "px_7712041_ng", partnerId: "ptr_902_ng", partnerName: "Stankings Advocates & Legal Partners", discipline: "legal_partner", region: "Abuja", status: "dispatched", dispatchedAt: "2026-07-31T05:40:00.000Z", slaMinutes: 30 },
    { dispatchId: "dsp_403", passportId: "px_6619028_gh", partnerId: "ptr_903_gh", partnerName: "Accra AutoMechanics & OBD Diagnostics", discipline: "vehicle_inspector", region: "Accra", status: "completed", dispatchedAt: "2026-07-31T04:00:00.000Z", slaMinutes: 30 },
  ]);

  const [testResult, setTestResult] = useState<string | null>(null);

  const simulateSlaCheck = (dsp: DispatchJob) => {
    const evalResult = evaluateSlaBreach(dsp);
    if (evalResult.isBreached) {
      setDispatches((prev) =>
        prev.map((d) => (d.dispatchId === dsp.dispatchId ? { ...d, status: "sla_breached" } : d))
      );
      setTestResult(`SLA Breach Warning: Dispatch ${dsp.dispatchId} elapsed ${evalResult.elapsedMinutes} mins (> ${dsp.slaMinutes} mins). Triggered BTOS event: ${evalResult.btosEventTriggered}`);
    } else {
      setTestResult(`Dispatch ${dsp.dispatchId} is within SLA bounds (${evalResult.elapsedMinutes} mins elapsed).`);
    }
  };

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-500" />
            Smart Geo-Fence Dispatch & SLA Response Monitor
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Target SLA: &lt;30 min dispatch response time. Automatic `SlaBreached` BTOS event escalation.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0">
          <ShieldCheck className="h-4 w-4" />
          <span>ON-TIME SLA RATE: 98.4%</span>
        </div>
      </div>

      {testResult && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold">
          {testResult}
        </div>
      )}

      {/* DISPATCH JOBS LIST */}
      <div className="space-y-3 font-mono text-[11px]">
        {dispatches.map((dsp) => {
          const isBreached = dsp.status === "sla_breached";

          return (
            <div
              key={dsp.dispatchId}
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                isBreached
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
                  : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-black text-xs text-navy dark:text-white">
                  <span>{dsp.dispatchId}</span>
                  <span className="text-navy/50 dark:text-white/50">({dsp.passportId})</span>
                  <span className="rounded-full bg-slate-200 dark:bg-white/10 text-navy dark:text-white px-2 py-0.2 text-[9px] uppercase flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5" /> {dsp.region}
                  </span>
                </div>
                <p className="text-[10px] text-navy/60 dark:text-white/60">
                  Partner: {dsp.partnerName} · Discipline: {dsp.discipline.replace("_", " ")}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => simulateSlaCheck(dsp)}
                  className="pressable rounded-xl bg-slate-100 dark:bg-white/10 text-navy dark:text-white px-3 py-1 font-bold text-[10px] uppercase flex items-center gap-1"
                >
                  <Play className="h-3 w-3 text-gold" /> Check SLA
                </button>

                <span
                  className={`rounded-full px-2.5 py-0.5 font-black uppercase text-[9px] flex items-center gap-1 ${
                    isBreached
                      ? "bg-rose-500 text-white"
                      : dsp.status === "completed"
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {isBreached && <AlertTriangle className="h-3 w-3" />}
                  {dsp.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
