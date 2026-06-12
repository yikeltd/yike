"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { ListingLeadStatus } from "@/lib/listing-leads/constants";
import { LEAD_SOURCE_LABELS, LISTING_LEAD_STATUSES } from "@/lib/listing-leads/constants";
import type { ListingLeadRow } from "@/lib/listing-leads/service";
import type { ListingLeadAnalytics } from "@/lib/listing-leads/analytics";
import type { LeadInsightsAccess } from "@/lib/listing-leads/access";
import { useCatalogPrice } from "@/hooks/use-revenue-catalog";
import { DEFAULT_REVENUE_PRICING } from "@/lib/revenue-pricing/defaults";
import { cn, formatPrice } from "@/lib/utils";

function leadTypeLabel(type: string): string {
  return type.replace(/_/g, " ");
}

export function SellerLeadsDashboard() {
  const [tab, setTab] = useState<ListingLeadStatus | "all">("all");
  const [leads, setLeads] = useState<ListingLeadRow[]>([]);
  const [access, setAccess] = useState<LeadInsightsAccess | null>(null);
  const [analytics, setAnalytics] = useState<ListingLeadAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const catalogLeadPrice = useCatalogPrice("lead_insights", "monthly");
  const leadInsightsPrice =
    catalogLeadPrice ??
    DEFAULT_REVENUE_PRICING.find(
      (i) => i.product === "lead_insights" && i.variant_key === "monthly"
    )?.amount ??
    0;

  const load = useCallback(async () => {
    setLoading(true);
    const statusQuery = tab === "all" ? "" : `?status=${tab}`;
    const [listRes, analyticsRes] = await Promise.all([
      fetch(`/api/agent/listing-leads${statusQuery}`),
      fetch("/api/agent/listing-leads/analytics"),
    ]);
    const listData = (await listRes.json()) as {
      leads?: ListingLeadRow[];
      access?: LeadInsightsAccess;
    };
    const analyticsData = (await analyticsRes.json()) as {
      analytics?: ListingLeadAnalytics;
      access?: LeadInsightsAccess;
    };
    setLoading(false);
    setLeads(listData.leads ?? []);
    setAccess(listData.access ?? analyticsData.access ?? null);
    setAnalytics(analyticsData.analytics ?? null);
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(leadId: string, status: ListingLeadStatus) {
    setBusyId(leadId);
    await fetch("/api/agent/listing-leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, status }),
    });
    setBusyId(null);
    void load();
  }

  return (
    <div className="space-y-6">
      {access && !access.hasFullHistory ? (
        <div className="rounded-xl border border-gold/25 bg-gold/5 px-4 py-3 text-sm text-navy">
          <p className="font-semibold">Showing your last {access.historyLimit} leads</p>
          <p className="mt-1 text-xs text-muted">
            Upgrade to Pro or add Lead Insights (
            {formatPrice(leadInsightsPrice, "total", "rent")}/mo) for full history, analytics, and
            CSV export.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="/agent/plans" prefetch className="text-xs font-bold text-navy underline">
              View plans
            </Link>
            <button
              type="button"
              className="text-xs font-bold text-gold-dark"
              onClick={() => void fetch("/api/subscriptions/lead-insights/checkout", { method: "POST" }).then(async (r) => {
                const d = (await r.json()) as { authorizationUrl?: string };
                if (d.authorizationUrl) window.location.href = d.authorizationUrl;
                else void load();
              })}
            >
              Buy Lead Insights
            </button>
          </div>
        </div>
      ) : null}

      {analytics ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Total leads" value={String(analytics.total)} />
          <Metric label="This month" value={String(analytics.thisMonth)} />
          <Metric label="This week" value={String(analytics.thisWeek)} />
          <Metric
            label="Conversion"
            value={access?.hasAnalytics ? `${analytics.conversionRate}%` : "—"}
          />
        </div>
      ) : null}

      {analytics?.bestListing && access?.hasAnalytics ? (
        <div className="rounded-xl border border-border bg-white p-4 text-sm">
          <p className="text-xs font-bold uppercase text-muted">Best performing listing</p>
          <p className="mt-1 font-semibold text-navy">{analytics.bestListing.title}</p>
          <p className="text-xs text-muted">{analytics.bestListing.count} leads</p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav className="flex flex-wrap gap-1.5">
          <TabButton active={tab === "all"} onClick={() => setTab("all")} label="All" />
          {LISTING_LEAD_STATUSES.map((s) => (
            <TabButton key={s} active={tab === s} onClick={() => setTab(s)} label={s} />
          ))}
        </nav>
        {access?.hasExport ? (
          <button
            type="button"
            onClick={() => window.location.assign("/api/agent/listing-leads/export")}
            className="rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-white"
          >
            Export CSV
          </button>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading leads…</p>
      ) : leads.length === 0 ? (
        <p className="text-sm text-muted">
          No leads yet. When renters tap WhatsApp, call, or save your listings, they appear here.
        </p>
      ) : (
        <ul className="space-y-2">
          {leads.map((lead) => (
            <li key={lead.id} className="rounded-xl border border-border bg-white p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold capitalize text-navy">{leadTypeLabel(lead.lead_type)}</p>
                  <p className="text-xs text-muted">
                    {lead.listing?.title ?? "Profile"} ·{" "}
                    {lead.lead_source
                      ? LEAD_SOURCE_LABELS[lead.lead_source as keyof typeof LEAD_SOURCE_LABELS] ??
                        lead.lead_source
                      : "Yike"}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(lead.created_at).toLocaleString("en-NG")}
                  </p>
                </div>
                <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold capitalize">
                  {lead.status}
                </span>
              </div>
              {access?.hasFiltering ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {LISTING_LEAD_STATUSES.filter((s) => s !== lead.status).map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={busyId === lead.id}
                      onClick={() => void updateStatus(lead.id, s)}
                      className="rounded-lg border border-border px-2 py-1 text-[10px] font-semibold capitalize text-navy"
                    >
                      Mark {s}
                    </button>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-3">
      <p className="text-[10px] font-semibold uppercase text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-navy tabular-nums">{value}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-2.5 py-1 text-xs font-semibold capitalize",
        active ? "bg-navy text-white" : "bg-surface text-muted"
      )}
    >
      {label}
    </button>
  );
}
