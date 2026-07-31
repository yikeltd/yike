"use client";

import type { SecretRotationLog } from "@/types/security";
import { Key, ShieldCheck, RefreshCw } from "lucide-react";

export function SecretManagerConsole() {
  const secrets: SecretRotationLog[] = [
    { secretId: "sec_1", serviceName: "Paystack Production Webhook Secret Key", lastRotated: "2026-07-15T00:00:00.000Z", nextRotationDue: "2026-10-15T00:00:00.000Z", autoRotate: true },
    { secretId: "sec_2", serviceName: "Korapay Merchant API Secret Key", lastRotated: "2026-07-20T00:00:00.000Z", nextRotationDue: "2026-10-20T00:00:00.000Z", autoRotate: true },
    { secretId: "sec_3", serviceName: "Supabase Service Role JWT Signing Key", lastRotated: "2026-07-01T00:00:00.000Z", nextRotationDue: "2026-10-01T00:00:00.000Z", autoRotate: true },
  ];

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-4 text-xs select-none">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-gold" />
          <h3 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white">
            Automated Secret Rotation & Key Lifecycle Console
          </h3>
        </div>

        <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[9px] font-black uppercase font-mono">
          AUTO-ROTATION SCHEDULE ACTIVE
        </span>
      </div>

      <div className="space-y-3 font-mono text-[11px]">
        {secrets.map((sec) => (
          <div
            key={sec.secretId}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-black text-xs text-navy dark:text-white">
                <RefreshCw className="h-3.5 w-3.5 text-gold" />
                <span>{sec.serviceName}</span>
              </div>
              <p className="text-[10px] text-navy/60 dark:text-white/60">
                Last Rotated: {new Date(sec.lastRotated).toLocaleDateString()} · Next Due: {new Date(sec.nextRotationDue).toLocaleDateString()}
              </p>
            </div>

            <span className="rounded-full bg-emerald-500 text-navy px-2.5 py-0.5 font-black uppercase text-[9px] flex items-center gap-1 shrink-0">
              <ShieldCheck className="h-3 w-3" />
              AUTO-ROTATION ON
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
