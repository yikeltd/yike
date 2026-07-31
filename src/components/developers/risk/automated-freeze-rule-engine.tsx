"use client";

import type { RiskRule } from "@/types/risk-intelligence";
import { Lock, ShieldAlert } from "lucide-react";

export function AutomatedFreezeRuleEngine() {
  const rules: RiskRule[] = [
    {
      id: "rule_1",
      name: "Price Anomaly Hold (>75% Below Market Value)",
      condition: "Listing price deviates >75% below regional benchmark",
      threshold: "-75% Price Delta",
      action: "FLAG_MODERATION",
      status: "active",
      triggeredToday: 14,
    },
    {
      id: "rule_2",
      name: "Unverified New Account High-Deposit Freeze",
      condition: "Unverified account attempts escrow deposit >₦100,000,000",
      threshold: ">₦100M Deposit",
      action: "FREEZE_ESCROW_CUSTODY",
      status: "active",
      triggeredToday: 2,
    },
    {
      id: "rule_3",
      name: "Duplicate C of O Document OCR Anomaly",
      condition: "Uploaded title document matches hash of existing verified asset",
      threshold: "Duplicate Document Hash",
      action: "REQUIRE_FIELD_VERIFIER",
      status: "active",
      triggeredToday: 0,
    },
  ];

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-4 text-xs select-none">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-gold" />
          <h3 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white">
            Automated Anomaly Freeze & Risk Intervention Rule Engine
          </h3>
        </div>

        <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[9px] font-black uppercase">
          3 Active Intervention Rules
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
                <ShieldAlert className="h-4 w-4 text-rose-500" />
                <span>{rule.name}</span>
              </div>
              <p className="text-[11px] text-navy/70 dark:text-white/70">
                Condition: {rule.condition} · Action: <strong className="font-mono text-gold">{rule.action}</strong>
              </p>
            </div>

            <div className="flex items-center gap-4 text-[10px] font-mono shrink-0">
              <span className="text-navy/50 dark:text-white/50">Triggered Today: {rule.triggeredToday}</span>
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
