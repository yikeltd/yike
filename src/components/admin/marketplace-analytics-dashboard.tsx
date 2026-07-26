import Link from "next/link";
import type {
  GrowthPoint,
  MarketplaceAnalyticsMetrics,
  RankedCount,
} from "@/lib/admin/marketplace-analytics";
import {
  adminListingsPath,
  adminPath,
  techPath,
} from "@/lib/admin-paths";
import {
  AdminPageHeader,
  MetricCard,
} from "@/components/admin/dashboard/admin-ui";

function RankBars({
  title,
  items,
  empty = "No data yet",
}: {
  title: string;
  items: RankedCount[];
  empty?: string;
}) {
  const max = items[0]?.count ?? 1;
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-navy">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.key}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="truncate font-medium text-navy">{item.label}</span>
                <span className="shrink-0 tabular-nums font-bold text-navy">
                  {item.count}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-navy/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-navy to-gold"
                  style={{
                    width: `${Math.max(8, (item.count / max) * 100)}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GrowthChart({
  title,
  points,
  series,
}: {
  title: string;
  points: GrowthPoint[];
  series: "listings" | "users";
}) {
  const values = points.map((p) => p[series]);
  const max = Math.max(1, ...values);
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-navy">{title}</h3>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
          {series}
        </p>
      </div>
      <div className="flex h-36 items-end gap-1.5 sm:gap-2">
        {points.map((p) => {
          const v = p[series];
          const h = Math.max(4, Math.round((v / max) * 100));
          return (
            <div
              key={p.label}
              className="flex min-w-0 flex-1 flex-col items-center gap-1"
            >
              <span className="text-[10px] font-bold tabular-nums text-navy/60">
                {v}
              </span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-navy to-gold/90"
                style={{ height: `${h}%` }}
                title={`${p.label}: ${v}`}
              />
              <span className="truncate text-[9px] font-semibold text-navy/45">
                {p.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CityHeatmap({ items }: { items: RankedCount[] }) {
  const max = items[0]?.count ?? 1;
  const top = items.slice(0, 12);
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-navy">City heatmap</h3>
      <p className="mt-0.5 text-xs text-muted">
        Approved inventory density by city
      </p>
      {top.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No city inventory yet</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {top.map((item) => {
            const intensity = item.count / max;
            return (
              <li
                key={item.key}
                className="rounded-xl border border-navy/8 px-3 py-3"
                style={{
                  background: `linear-gradient(135deg, rgba(228,181,71,${0.12 + intensity * 0.45}) 0%, rgba(3,27,78,${0.04 + intensity * 0.12}) 100%)`,
                }}
              >
                <p className="truncate text-sm font-bold text-navy">{item.label}</p>
                <p className="mt-0.5 text-lg font-black tabular-nums text-navy">
                  {item.count}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Internal-only marketplace control tower. Not a consumer feature. */
export function MarketplaceAnalyticsDashboard({
  metrics,
}: {
  metrics: MarketplaceAnalyticsMetrics;
}) {
  const updated = new Date(metrics.generatedAt).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const m = metrics.marketplace;
  const u = metrics.users;
  const a = metrics.activity;
  const t = metrics.trust;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Marketplace control tower"
        description={`Launch-day ops pulse — inventory, users, activity, trust. Updated ${updated}. Internal only.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={adminPath("analytics")}
              className="pressable rounded-xl border border-navy/15 bg-white px-4 py-2 text-sm font-semibold text-navy"
            >
              CEO revenue analytics
            </Link>
            <Link
              href={adminListingsPath("pending")}
              className="pressable rounded-xl bg-navy px-4 py-2 text-sm font-bold text-gold"
            >
              Review queue
            </Link>
          </div>
        }
      />

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
          Marketplace
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <MetricCard label="Total listings" value={m.total} href={adminPath("listings")} />
          <MetricCard
            label="Vehicle listings"
            value={m.vehicles}
            href={`${adminPath("listings")}?vertical=vehicle`}
          />
          <MetricCard
            label="Property listings"
            value={m.properties}
            href={`${adminPath("listings")}?vertical=property`}
          />
          <MetricCard
            label="Pending approval"
            value={m.pending}
            href={adminListingsPath("pending")}
            variant="warning"
          />
          <MetricCard
            label="Approved"
            value={m.approved}
            href={adminListingsPath("approved")}
            variant="success"
          />
          <MetricCard
            label="Rejected"
            value={m.rejected}
            href={adminListingsPath("rejected")}
            variant="danger"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
          Users
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="New users today" value={u.newToday} href={adminPath("users")} />
          <MetricCard label="Sellers" value={u.sellers} href={adminPath("users")} />
          <MetricCard label="Buyers" value={u.buyers} href={adminPath("users")} />
          <MetricCard label="Dealers" value={u.dealers} href={`${adminPath("users")}?filter=dealers`} />
          <MetricCard
            label="Verified dealers"
            value={u.verifiedDealers}
            variant="success"
            href={`${adminPath("users")}?filter=dealers`}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
          Marketplace activity · today
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label="Search impressions"
            value={a.searchesToday}
            sub="listing_analytics_events · search_impression"
          />
          <MetricCard
            label="Listing views"
            value={a.listingViewsToday}
            sub={`All-time counter sum · ${a.listingViewsAllTime.toLocaleString("en-NG")}`}
          />
          <MetricCard
            label="Dealer profile views"
            value={a.dealerProfileViewsToday ?? "—"}
            sub="Not instrumented in DB yet"
          />
          <MetricCard
            label="Contact attempts"
            value={a.contactAttemptsToday}
            sub={`WhatsApp/call events · all-time clicks ${a.contactClicksAllTime.toLocaleString("en-NG")}`}
          />
          <MetricCard label="Saved listings" value={a.savedToday} />
          <MetricCard
            label="Reports submitted"
            value={a.reportsToday}
            href={adminPath("reports")}
            variant={a.reportsToday > 0 ? "warning" : "default"}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
          Inventory mix
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <CityHeatmap items={metrics.inventory.byCity} />
          <RankBars title="By category" items={metrics.inventory.byCategory} />
          <RankBars title="By make (vehicles)" items={metrics.inventory.byMake} />
          <RankBars title="By price range" items={metrics.inventory.byPriceRange} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
          Trust
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Verified sellers" value={t.verifiedSellers} variant="success" />
          <MetricCard
            label="Media-protected listings"
            value={t.mediaProtectedListings}
            href={techPath("uploads")}
          />
          <MetricCard
            label="Flagged listings"
            value={t.flaggedListings}
            variant={t.flaggedListings > 0 ? "danger" : "default"}
          />
          <MetricCard
            label="Pending reviews"
            value={t.pendingReviews}
            href={adminListingsPath("pending")}
            variant="warning"
          />
          <MetricCard
            label="Open reports"
            value={t.openReports}
            href={adminPath("reports")}
            variant={t.openReports > 0 ? "warning" : "default"}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
          Growth
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <GrowthChart title="Daily · listings" points={metrics.growth.daily} series="listings" />
          <GrowthChart title="Daily · users" points={metrics.growth.daily} series="users" />
          <GrowthChart title="Weekly · listings" points={metrics.growth.weekly} series="listings" />
          <GrowthChart title="Weekly · users" points={metrics.growth.weekly} series="users" />
          <GrowthChart title="Monthly · listings" points={metrics.growth.monthly} series="listings" />
          <GrowthChart title="Monthly · users" points={metrics.growth.monthly} series="users" />
        </div>
      </section>

      <p className="rounded-xl border border-dashed border-navy/15 bg-navy/[0.02] px-4 py-3 text-xs text-navy/55">
        Feature freeze remains active. This dashboard is staff-only ops tooling — not a
        consumer product surface. Dealer profile views show “—” until that event is
        persisted. Search counts use <code>search_impression</code> events when logged.
      </p>
    </div>
  );
}
