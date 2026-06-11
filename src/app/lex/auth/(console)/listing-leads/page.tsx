"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

type AdminLeadMetrics = {
  volume30d: number;
  bySource: Record<string, number>;
  byType: Record<string, number>;
  topListings: Array<{ listingId: string; title: string; city: string; count: number }>;
  topSellerIds: Array<{ sellerId: string; count: number }>;
  leadPackageRevenue: number;
  leadPackageSubscribers: number;
};

export default function AdminListingLeadsPage() {
  const [metrics, setMetrics] = useState<AdminLeadMetrics | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/listing-leads");
      const data = (await res.json()) as AdminLeadMetrics;
      setMetrics(data);
    })();
  }, []);

  if (!metrics) {
    return <p className="text-sm text-muted">Loading lead metrics…</p>;
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold">Listing leads</h1>
        <p className="text-sm text-muted">
          Aggregate volume and sources — no private buyer contact details.
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-muted">Leads (30d)</p>
          <p className="text-2xl font-bold text-navy">{metrics.volume30d}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-muted">Lead package revenue (30d)</p>
          <p className="text-2xl font-bold text-navy">
            {formatPrice(metrics.leadPackageRevenue, "total", "rent")}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-muted">Lead Insights subscribers</p>
          <p className="text-2xl font-bold text-navy">{metrics.leadPackageSubscribers}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-4">
          <h2 className="text-sm font-bold text-navy">By source</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {Object.entries(metrics.bySource).map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span className="capitalize">{k.replace(/_/g, " ")}</span>
                <span className="font-semibold tabular-nums">{v}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <h2 className="text-sm font-bold text-navy">By type</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {Object.entries(metrics.byType).map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span className="capitalize">{k.replace(/_/g, " ")}</span>
                <span className="font-semibold tabular-nums">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-4">
        <h2 className="text-sm font-bold text-navy">Top listings (30d)</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {metrics.topListings.map((row) => (
            <li key={row.listingId} className="flex justify-between gap-2">
              <span className="truncate">
                {row.title} · {row.city}
              </span>
              <span className="shrink-0 font-semibold tabular-nums">{row.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
