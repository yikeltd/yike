"use client";

import type { AlertRule } from "@/types/observability";
import { Bell, ShieldAlert } from "lucide-react";

export function AlertRulesCatalog() {
  const rules: AlertRule[] = [
    {
      id: "RULE_1",
      name: "High API Latency Spike (>500ms)",
      targetService: "All API Endpoints",
      condition: "P95 Latency > 500ms over 5m window",
      threshold: "500ms",
      severity: "warning",
      enabled: true,
      lastTriggered: "None (Healthy)",
    },
    {
      id: "RULE_2",
      name: "Elevated HTTP 5xx Error Rate (>1%)",
      targetService: "Escrow & Payment APIs",
      condition: "HTTP 5xx responses exceed 1.0% over 2m window",
      threshold: "1.0%",
      severity: "critical",
      enabled: true,
      lastTriggered: "None (Healthy)",
    },
    {
      id: "RULE_3",
      name: "Webhook Dead-Letter Exhaustion",
      targetService: "Real-Time Webhook Engine",
      condition: "Dead-letter queue receives >10 undeliverable webhooks/min",
      threshold: "10 msgs/min",
      severity: "warning",
      enabled: true,
      lastTriggered: "Jul 22, 2026",
    },
  ];

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-4 text-xs select-none">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-gold" />
          <h3 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white">
            Configurable Automated Alert Rules & Incident Triggers
          </h3>
        </div>

        <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[9px] font-black uppercase">
          3 Active Alert Monitors
        </span>
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-black text-sm text-navy dark:text-white">
                <ShieldAlert className={rule.severity === "critical" ? "h-4 w-4 text-rose-500" : "h-4 w-4 text-amber-500"} />
                <span>{rule.name}</span>
              </div>
              <p className="text-[11px] text-navy/70 dark:text-white/70">
                Target: <strong className="text-gold">{rule.targetService}</strong> · Condition: {rule.condition}
              </p>
            </div>

            <div className="flex items-center gap-3 text-[10px] font-mono shrink-0">
              <span className="text-navy/50 dark:text-white/50">Threshold: {rule.threshold}</span>
              <span className="rounded-full bg-emerald-500 text-navy px-2 py-0.5 font-black uppercase text-[9px]">
                ENABLED
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
