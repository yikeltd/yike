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
}: {
  label: string;
  value: number;
  locked?: boolean;
  href?: string;
}) {
  const inner = (
    <div
      className={cn(
        "relative rounded-xl border border-border bg-white px-3 py-2.5",
        href && "pressable"
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-navy/55">{label}</p>
      {locked ? (
        <div className="mt-1 flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-muted" aria-hidden />
          <span className="text-sm font-bold text-muted blur-[2px] select-none">00</span>
        </div>
      ) : (
        <p className="mt-1 text-lg font-bold tabular-nums text-navy">{value}</p>
      )}
    </div>
  );

  if (href && !locked) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}

export function SellerAnalyticsPanel({
  className,
  activeCount,
  pending,
  leadsCount,
  savedCount,
}: {
  className?: string;
  activeCount: number;
  pending: number;
  leadsCount: number;
  savedCount: number;
}) {
  const [data, setData] = useState<SellerAnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/agent/seller-analytics");
      const json = (await res.json()) as { analytics?: SellerAnalyticsSummary; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not load analytics");
        return;
      }
      setData(json.analytics ?? null);
    })();
  }, []);

  const advanced = data?.hasAdvanced ?? false;

  return (
    <section className={cn("space-y-2.5", className)}>
      <div className="flex items-center justify-between gap-2 px-0.5">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-navy/70">
          Analytics (30d)
        </h2>
        {!advanced ? (
          <Link href="/agent/plans" prefetch className="text-[11px] font-semibold text-navy">
            Upgrade for advanced analytics
          </Link>
        ) : null}
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Active listings" value={activeCount} href="/agent/listings" />
        <Metric label="Pending review" value={pending} href="/agent/listings" />
        <Metric label="Inquiries" value={leadsCount} href="/agent/leads" />
        <Metric label="Saved homes" value={savedCount} href="/saved" />
      </div>

      {data ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Views" value={data.listingViews} locked={!advanced} />
            <Metric label="Leads" value={data.leadsGenerated} locked={!advanced} />
            <Metric label="Saves" value={data.saves} locked={!advanced} />
            <Metric label="Likes" value={data.listingLikes} />
          </div>

          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="text-[11px] font-semibold text-muted hover:text-navy"
          >
            {advancedOpen ? "Hide" : "Show"} channel breakdown
          </button>

          {advancedOpen ? (
            <div className="grid grid-cols-3 gap-2">
              <Metric label="WhatsApp" value={data.whatsappClicks} locked={!advanced} />
              <Metric label="Calls" value={data.callClicks} locked={!advanced} />
              <Metric label="Followers" value={data.followers} href="/agent/followers" />
            </div>
          ) : null}
        </>
      ) : !error ? (
        <p className="text-xs text-muted">Loading analytics…</p>
      ) : null}
    </section>
  );
}
