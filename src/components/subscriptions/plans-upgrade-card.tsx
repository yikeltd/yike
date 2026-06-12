"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const PLANS_HREF = "/agent/plans";

export function PlansUpgradeCard({
  planLabel,
  activeCount,
  limit,
  expiresInDays,
  className,
}: {
  planLabel?: string | null;
  activeCount: number;
  limit: number | null;
  expiresInDays?: number | null;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const planName = planLabel ?? "Starter Plan";
  const limitLabel = limit == null ? "∞" : String(limit);
  const showRenew = expiresInDays != null && expiresInDays <= 14 && planLabel;

  async function renew() {
    setBusy(true);
    const res = await fetch("/api/subscriptions/renew", { method: "POST" });
    const data = (await res.json()) as { authorizationUrl?: string };
    setBusy(false);
    if (data.authorizationUrl) window.location.assign(data.authorizationUrl);
    else window.location.reload();
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-elevated px-3.5 py-3 shadow-float",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-navy px-2.5 py-0.5 text-[10px] font-bold text-white">
          {planName}
        </span>
        <Link
          href={PLANS_HREF}
          prefetch
          className="pressable rounded-lg bg-gold px-3 py-1 text-[11px] font-bold text-navy shadow-sm"
        >
          Upgrade
        </Link>
      </div>
      <p className="mt-2.5 text-xl font-bold tabular-nums text-navy">
        {activeCount}
        <span className="text-base font-semibold text-muted"> / {limitLabel}</span>
        <span className="ml-1.5 text-xs font-medium text-muted">listings used</span>
      </p>
      {showRenew ? (
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-2">
          <p className="text-[11px] text-muted">
            Expires in {expiresInDays}d
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void renew()}
            className="text-[11px] font-bold text-navy disabled:opacity-60"
          >
            {busy ? "…" : "Renew"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
