"use client";

import { useCallback, useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

type SubRow = {
  id: string;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  founding_price_locked: boolean;
  plan?: { name: string; plan_code: string; monthly_price: number } | null;
  profile?: { full_name?: string; email?: string; company_name?: string } | null;
};

type Metrics = {
  activeSubscribers: number;
  mrr: number;
  expiringSoon: number;
  subscriptionRevenue30d: number;
};

export function SubscriptionsBoard() {
  const [tab, setTab] = useState("active");
  const [rows, setRows] = useState<SubRow[]>([]);
  const [tabs, setTabs] = useState<Array<{ id: string; label: string }>>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/subscriptions?status=${tab}`);
    const data = (await res.json()) as {
      subscriptions?: SubRow[];
      tabs?: Array<{ id: string; label: string }>;
      metrics?: Metrics;
    };
    setLoading(false);
    setRows(data.subscriptions ?? []);
    setTabs(data.tabs ?? []);
    setMetrics(data.metrics ?? null);
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const money = (n: number) => formatPrice(n, "total", "rent");

  return (
    <div className="space-y-6">
      {metrics ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-white px-4 py-3">
            <p className="text-xs text-muted">Subscription revenue (30d)</p>
            <p className="text-xl font-bold text-navy">{money(metrics.subscriptionRevenue30d)}</p>
          </div>
          <div className="rounded-xl border border-border bg-white px-4 py-3">
            <p className="text-xs text-muted">Active subscribers</p>
            <p className="text-xl font-bold text-navy">{metrics.activeSubscribers}</p>
          </div>
          <div className="rounded-xl border border-border bg-white px-4 py-3">
            <p className="text-xs text-muted">MRR</p>
            <p className="text-xl font-bold text-navy">{money(metrics.mrr)}</p>
          </div>
          <div className="rounded-xl border border-border bg-white px-4 py-3">
            <p className="text-xs text-muted">Renewals due (7d)</p>
            <p className="text-xl font-bold text-navy">{metrics.expiringSoon}</p>
          </div>
        </div>
      ) : null}

      <nav className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-semibold",
              tab === t.id ? "bg-navy text-white" : "bg-surface text-muted"
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted">No subscriptions in this tab.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="rounded-xl border border-border bg-white p-4">
              <p className="font-semibold text-navy">
                {row.profile?.company_name || row.profile?.full_name || "Seller"}
              </p>
              <p className="text-xs text-muted">
                {row.plan?.name} · {money(row.plan?.monthly_price ?? 0)} · {row.status}
              </p>
              {row.expires_at ? (
                <p className="mt-1 text-xs text-muted">
                  Expires {new Date(row.expires_at).toLocaleDateString("en-NG")}
                </p>
              ) : null}
              {row.founding_price_locked ? (
                <p className="mt-1 text-xs font-medium text-gold">Founding pricing</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
