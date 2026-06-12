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
        "yike-card yike-card-compact",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="yike-status-pill yike-status-pill--neutral bg-navy px-2 py-0.5 text-[10px] font-bold text-white">
          {planName}
        </span>
        <Link
          href={PLANS_HREF}
          prefetch
          className="pressable rounded-md bg-gold px-2.5 py-0.5 text-[10px] font-bold text-navy"
        >
          Upgrade
        </Link>
      </div>
      <p className="mt-2 text-lg font-bold leading-tight tabular-nums text-navy">
        {activeCount}
        <span className="text-sm font-semibold text-muted"> / {limitLabel}</span>
        <span className="ml-1 text-[10px] font-medium text-muted">listings</span>
      </p>
      {showRenew ? (
        <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-border pt-1.5">
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
