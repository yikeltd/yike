"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANS_HREF = "/agent/plans";

export function PlansUpgradeCard({
  planLabel,
  activeCount,
  limit,
  expiresInDays,
  className,
  variant = "default",
}: {
  planLabel?: string | null;
  activeCount: number;
  limit: number | null;
  expiresInDays?: number | null;
  className?: string;
  variant?: "default" | "command";
}) {
  const [busy, setBusy] = useState(false);
  const planName = planLabel ?? "Starter";
  const limitLabel = limit == null ? "∞" : String(limit);
  const showRenew = expiresInDays != null && expiresInDays <= 14 && planLabel;
  const usagePct =
    limit == null || limit <= 0
      ? 0
      : Math.min(100, Math.round((activeCount / limit) * 100));

  async function renew() {
    setBusy(true);
    const res = await fetch("/api/subscriptions/renew", { method: "POST" });
    const data = (await res.json()) as { authorizationUrl?: string };
    setBusy(false);
    if (data.authorizationUrl) window.location.assign(data.authorizationUrl);
    else window.location.reload();
  }

  if (variant === "command") {
    return (
      <section
        className={cn(
          "overflow-hidden rounded-[1.5rem] border border-navy/[0.06] bg-white p-4 shadow-[0_8px_28px_-18px_rgba(3,27,78,0.28)]",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy/40">
              Current plan
            </p>
            <p className="mt-1 text-xl font-bold tracking-tight text-navy">{planName}</p>
            <p className="mt-1 text-xs text-navy/55">
              {activeCount} of {limitLabel} active listings in use
            </p>
          </div>
          <Link
            href={PLANS_HREF}
            prefetch
            className="pressable inline-flex h-9 items-center gap-1 rounded-full bg-gold px-3.5 text-[11px] font-bold text-navy"
          >
            {planLabel ? "Manage" : "Upgrade"}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        {limit != null ? (
          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-navy/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-navy to-gold transition-[width] duration-700"
                style={{ width: `${usagePct}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] font-semibold text-navy/45">
              {Math.max(0, limit - activeCount)} listings remaining
            </p>
          </div>
        ) : (
          <p className="mt-3 text-[11px] font-semibold text-navy/50">
            Unlimited listing capacity on this plan.
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={PLANS_HREF}
            className="pressable rounded-full bg-navy/[0.04] px-3 py-1.5 text-[11px] font-bold text-navy"
          >
            Compare plans
          </Link>
          {showRenew ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void renew()}
              className="pressable rounded-full bg-navy px-3 py-1.5 text-[11px] font-bold text-gold disabled:opacity-60"
            >
              {busy ? "…" : `Renew · ${expiresInDays}d left`}
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className={cn("yike-card yike-card-compact", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="yike-status-pill yike-status-pill--neutral bg-navy px-2 py-0.5 text-[10px] font-bold text-white">
          {planName} Plan
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
          <p className="text-[11px] text-muted">Expires in {expiresInDays}d</p>
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
