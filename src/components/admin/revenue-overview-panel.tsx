"use client";

import { useEffect, useState } from "react";
import type { RevenueOverviewMetrics } from "@/lib/payments/revenue-metrics";
import { formatPrice } from "@/lib/utils";

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-navy tabular-nums">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted">{sub}</p> : null}
    </div>
  );
}

export function RevenueOverviewPanel() {
  const [metrics, setMetrics] = useState<RevenueOverviewMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/revenue/overview");
      const data = (await res.json()) as {
        metrics?: RevenueOverviewMetrics;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not load revenue metrics");
        return;
      }
      setMetrics(data.metrics ?? null);
    })();
  }, []);

  if (error) {
    return <p className="text-sm text-danger">{error}</p>;
  }

  if (!metrics) {
    return <p className="text-sm text-muted">Loading revenue metrics…</p>;
  }

  const money = (n: number) => formatPrice(n, "total", "rent");

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Today's revenue" value={money(metrics.todayRevenue)} />
      <MetricCard label="7-day revenue" value={money(metrics.revenue7d)} />
      <MetricCard label="30-day revenue" value={money(metrics.revenue30d)} />
      <MetricCard
        label="Featured listings sold"
        value={String(metrics.featuredListingsSold)}
      />
      <MetricCard label="Boost revenue (30d)" value={money(metrics.boostRevenue)} />
      <MetricCard label="Boost orders" value={String(metrics.boostOrders)} />
      <MetricCard label="Active boosts" value={String(metrics.activeBoosts)} />
      <MetricCard label="Expired boosts" value={String(metrics.expiredBoosts)} />
      <MetricCard label="Pending payments" value={String(metrics.pendingPayments)} />
      <MetricCard label="Successful payments" value={String(metrics.successfulPayments)} />
      <MetricCard label="Failed payments" value={String(metrics.failedPayments)} />
      <MetricCard
        label="Verification revenue (30d)"
        value={money(metrics.propertyVerificationRevenue)}
      />
      <MetricCard
        label="Paid verification requests"
        value={String(metrics.propertyVerificationPaid)}
      />
      <MetricCard
        label="Completed verifications"
        value={String(metrics.propertyVerificationCompleted)}
      />
      <MetricCard
        label="Pending verifications"
        value={String(metrics.propertyVerificationPending)}
      />
      <MetricCard
        label="Avg completion time"
        value={
          metrics.propertyVerificationAvgCompletionHours != null
            ? `${metrics.propertyVerificationAvgCompletionHours}h`
            : "—"
        }
      />
      <MetricCard label="Advertising revenue (30d)" value={money(metrics.advertisingRevenue)} />
      <MetricCard label="Active ads" value={String(metrics.activeAds)} />
      <MetricCard
        label="Upcoming expiry"
        value={String(metrics.adsExpiringSoon)}
        sub="Active ads ending within 7 days"
      />
      <MetricCard
        label="Top performing ad"
        value={
          metrics.topPerformingAds[0]
            ? `${metrics.topPerformingAds[0].clicks} clicks`
            : "—"
        }
        sub={
          metrics.topPerformingAds[0]
            ? `${metrics.topPerformingAds[0].title} · ${metrics.topPerformingAds[0].ctr}% CTR`
            : "No impressions yet"
        }
      />
      <MetricCard label="Subscription revenue (30d)" value={money(metrics.subscriptionRevenue)} />
      <MetricCard label="Active subscribers" value={String(metrics.activeSubscribers)} />
      <MetricCard label="MRR" value={money(metrics.subscriptionMrr)} />
      <MetricCard
        label="Subscriptions expiring soon"
        value={String(metrics.subscriptionsExpiringSoon)}
        sub="Within 7 days"
      />
      <MetricCard label="Lead Insights revenue (30d)" value={money(metrics.leadInsightsRevenue)} />
      <MetricCard label="Lead Insights subscribers" value={String(metrics.leadInsightsSubscribers)} />
    </div>
  );
}
