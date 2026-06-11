"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SellerAnalyticsSummary } from "@/lib/subscriptions/analytics";
import { cn } from "@/lib/utils";

function Stat({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-white px-3 py-3",
        muted && "opacity-60"
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-navy tabular-nums">{value}</p>
    </div>
  );
}

export function SellerAnalyticsPanel({ className }: { className?: string }) {
  const [data, setData] = useState<SellerAnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (error) {
    return <p className={cn("text-sm text-danger", className)}>{error}</p>;
  }

  if (!data) {
    return <p className={cn("text-sm text-muted", className)}>Loading analytics…</p>;
  }

  const advanced = data.hasAdvanced;

  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-navy">Seller analytics · 30 days</h2>
        {!advanced ? (
          <Link href="/pricing" className="text-xs font-semibold text-gold">
            Upgrade for advanced
          </Link>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Listing views" value={data.listingViews} muted={!advanced && data.listingViews > 0} />
        <Stat label="WhatsApp" value={data.whatsappClicks} muted={!advanced} />
        <Stat label="Calls" value={data.callClicks} muted={!advanced} />
        <Stat label="Saves" value={data.saves} muted={!advanced} />
        <Stat label="Followers" value={data.followers} />
        <Stat label="Listing likes" value={data.listingLikes} />
        <Stat label="Leads" value={data.leadsGenerated} muted={!advanced} />
      </div>
      {!advanced ? (
        <p className="text-xs text-muted">
          Basic plan shows summary counts. Pro and above unlock full breakdowns.
        </p>
      ) : null}
    </section>
  );
}
