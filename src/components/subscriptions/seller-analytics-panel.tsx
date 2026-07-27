"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import type { SellerAnalyticsSummary } from "@/lib/subscriptions/analytics";
import { cn } from "@/lib/utils";

function Metric({
  label,
  value,
  locked,
  href,
  compact,
}: {
  label: string;
  value: number | string;
  locked?: boolean;
  href?: string;
  compact?: boolean;
}) {
  const inner = (
    <div
      className={cn(
        "relative rounded-xl border border-navy/[0.05] bg-navy/[0.02] transition-colors",
        compact ? "px-2.5 py-2.5" : "yike-card yike-card-compact",
        href && !locked && "pressable hover:bg-white hover:border-navy/10",
      )}
    >
      <p className="text-[9px] font-bold uppercase tracking-wider text-navy/45">
        {label}
      </p>
      {locked ? (
        <div className="mt-1 flex items-center gap-1">
          <Lock className="h-3 w-3 text-navy/30" aria-hidden />
          <span className="select-none text-base font-bold text-navy/25 blur-[3px]">
            88%
          </span>
        </div>
      ) : (
        <p className="mt-1 text-lg font-bold leading-none tabular-nums text-navy">
          {value}
        </p>
      )}
    </div>
  );

  if (href && !locked) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}

export interface SellerAnalyticsPanelProps {
  className?: string;
  activeCount: number;
  pending: number;
  leadsCount: number;
  savedCount: number;
  responseRate?: number | null;
  averageResponseTimeMinutes?: number | null;
  initialData?: SellerAnalyticsSummary | null;
  variant?: "default" | "command";
}

export function SellerAnalyticsPanel({
  className,
  activeCount,
  pending,
  leadsCount,
  savedCount,
  responseRate,
  averageResponseTimeMinutes,
  initialData,
  variant = "default",
}: SellerAnalyticsPanelProps) {
  const [fetchedData, setFetchedData] = useState<SellerAnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const command = variant === "command";

  useEffect(() => {
    if (initialData !== undefined) {
      return;
    }
    void (async () => {
      const res = await fetch("/api/agent/seller-analytics");
      const json = (await res.json()) as {
        analytics?: SellerAnalyticsSummary;
        error?: string;
      };
      if (!res.ok) {
        setError(json.error ?? "Could not load analytics");
        return;
      }
      setFetchedData(json.analytics ?? null);
    })();
  }, [initialData]);

  const data = initialData !== undefined ? initialData : fetchedData;
  const advanced = data?.hasAdvanced ?? false;
  const responseRateLabel =
    responseRate == null
      ? "—"
      : `${Math.round((responseRate <= 1 ? responseRate * 100 : responseRate))}%`;
  const averageResponseLabel =
    averageResponseTimeMinutes == null
      ? "—"
      : averageResponseTimeMinutes < 60
        ? `${Math.round(averageResponseTimeMinutes)}m`
        : `${Math.round(averageResponseTimeMinutes / 60)}h`;
  const conversionLabel =
    data && data.listingViews > 0
      ? `${Math.round((data.leadsGenerated / data.listingViews) * 100)}%`
      : "—";

  return (
    <section className={cn("space-y-3", className)}>
      {!command ? (
        <div className="flex items-center justify-between gap-2 px-0.5">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-navy/70">
            Analytics (30d)
          </h2>
          {!advanced ? (
            <Link
              href="/agent/plans"
              prefetch
              className="text-[11px] font-semibold text-navy"
            >
              Upgrade for advanced analytics
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 px-0.5">
          <p className="text-sm font-bold text-navy">Last 30 days</p>
          {!advanced ? (
            <Link
              href="/agent/plans"
              prefetch
              className="inline-flex items-center gap-1 rounded-full bg-navy/[0.04] px-2.5 py-1 text-[10px] font-bold text-navy/70"
            >
              <Lock className="h-3 w-3" aria-hidden />
              Premium
            </Link>
          ) : null}
        </div>
      )}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric
          label="Active"
          value={activeCount}
          href="/agent/listings"
          compact={command}
        />
        <Metric
          label="Pending"
          value={pending}
          href="/agent/listings"
          compact={command}
        />
        <Metric
          label="Enquiries"
          value={leadsCount}
          href="/agent/leads"
          compact={command}
        />
        <Metric
          label="Saves"
          value={savedCount}
          href="/saved"
          compact={command}
        />
      </div>

      {data ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric
              label="Views"
              value={data.listingViews}
              locked={!advanced}
              compact={command}
            />
            <Metric
              label="Leads"
              value={data.leadsGenerated}
              locked={!advanced}
              compact={command}
            />
            <Metric
              label="Saves"
              value={data.saves}
              locked={!advanced}
              compact={command}
            />
            <Metric
              label="Likes"
              value={data.listingLikes}
              compact={command}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Metric
              label="Response"
              value={responseRateLabel}
              locked={!advanced}
              compact={command}
            />
            <Metric
              label="Avg time"
              value={averageResponseLabel}
              locked={!advanced}
              compact={command}
            />
            <Metric
              label="Conversion"
              value={conversionLabel}
              locked={!advanced}
              compact={command}
            />
          </div>

          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="text-[11px] font-semibold text-navy/45 hover:text-navy"
          >
            {advancedOpen ? "Hide" : "Show"} channel breakdown
          </button>

          {advancedOpen ? (
            <div className="grid grid-cols-3 gap-2">
              <Metric
                label="WhatsApp"
                value={data.whatsappClicks}
                locked={!advanced}
                compact={command}
              />
              <Metric
                label="Calls"
                value={data.callClicks}
                locked={!advanced}
                compact={command}
              />
              <Metric
                label="Followers"
                value={data.followers}
                href="/agent/followers"
                compact={command}
              />
            </div>
          ) : null}

          {!advanced && command ? (
            <div className="relative overflow-hidden rounded-xl border border-navy/[0.06] bg-gradient-to-r from-navy/[0.03] to-gold/10 px-3 py-3">
              <div className="pointer-events-none absolute inset-0 backdrop-blur-[1px]" />
              <div className="relative flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-navy/65">
                  Response rate & conversion unlock with Premium.
                </p>
                <Link
                  href="/agent/plans"
                  className="pressable inline-flex h-8 items-center rounded-full bg-navy px-3 text-[10px] font-bold text-gold"
                >
                  Upgrade
                </Link>
              </div>
            </div>
          ) : null}
        </>
      ) : !error ? (
        <p className="text-xs text-muted">Loading analytics…</p>
      ) : null}
    </section>
  );
}
