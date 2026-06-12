import Link from "next/link";
import type { CeoDashboardMetrics, RevenueStreamMetrics } from "@/lib/admin/ceo-dashboard";
import { adminPath } from "@/lib/admin-paths";
import { AdminPageHeader, MetricCard } from "@/components/admin/dashboard/admin-ui";
import { formatPrice } from "@/lib/utils";

function money(n: number) {
  return formatPrice(n, "total", "rent");
}

function RevenueRow({
  label,
  stream,
  href,
}: {
  label: string;
  stream: RevenueStreamMetrics;
  href?: string;
}) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-navy">{label}</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-navy">
            {money(stream.amountMonth)}
          </p>
          <p className="text-xs text-muted">This month · {stream.countMonth} sales</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Today</p>
          <p className="text-lg font-bold tabular-nums text-navy">{money(stream.amountToday)}</p>
          <p className="text-xs text-muted">{stream.countToday} sales</p>
        </div>
      </div>
      {href ? (
        <Link href={href} className="mt-3 inline-block text-xs font-semibold text-navy underline">
          Manage
        </Link>
      ) : null}
    </div>
  );
}

function RankList({ title, items }: { title: string; items: { label: string; count: number }[] }) {
  const max = items[0]?.count ?? 1;
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-navy">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No data yet</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.label}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="truncate font-medium text-navy">{item.label}</span>
                <span className="shrink-0 tabular-nums font-bold text-navy">{item.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-gold"
                  style={{ width: `${Math.max(8, (item.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CeoDashboard({ metrics }: { metrics: CeoDashboardMetrics }) {
  const updated = new Date(metrics.generatedAt).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="CEO control tower"
        description={`Platform pulse — supply, users, revenue, and conversion. Updated ${updated}.`}
        actions={
          <Link
            href={adminPath("revenue/overview")}
            className="pressable rounded-xl border border-navy/15 bg-white px-4 py-2 text-sm font-semibold text-navy"
          >
            Revenue detail
          </Link>
        }
      />

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Supply</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Listings today"
            value={metrics.supply.listingsToday}
            href={adminPath("listings")}
          />
          <MetricCard
            label="Listings this month"
            value={metrics.supply.listingsThisMonth}
            href={adminPath("listings")}
          />
          <MetricCard
            label="New users today"
            value={metrics.users.newToday}
            href={adminPath("users")}
          />
          <MetricCard
            label="New users this month"
            value={metrics.users.newThisMonth}
            href={adminPath("users")}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Revenue</h2>
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <MetricCard
            label="Total platform revenue today"
            value={money(metrics.revenue.totalToday)}
            variant="success"
          />
          <MetricCard
            label="Total platform revenue this month"
            value={money(metrics.revenue.totalMonth)}
            variant="success"
            href={adminPath("revenue/overview")}
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <RevenueRow
            label="Featured sales"
            stream={metrics.revenue.featured}
            href={adminPath("revenue/featured-listings")}
          />
          <RevenueRow
            label="Boost sales"
            stream={metrics.revenue.boost}
            href={adminPath("featured")}
          />
          <RevenueRow
            label="Verification sales"
            stream={metrics.revenue.verification}
            href={adminPath("property-verifications")}
          />
          <RevenueRow
            label="Subscription revenue"
            stream={metrics.revenue.subscription}
            href={adminPath("subscriptions")}
          />
          <RevenueRow
            label="Ad revenue"
            stream={metrics.revenue.ads}
            href={adminPath("advertising")}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <RankList title="Top cities" items={metrics.topCities} />
        <RankList title="Top categories" items={metrics.topCategories} />
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
          Conversion rates
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="View → inquiry"
            value={`${metrics.conversion.viewToInquiryRate}%`}
            sub="Approved listings (all time)"
          />
          <MetricCard
            label="WhatsApp funnel"
            value={`${metrics.conversion.whatsappFunnelRate}%`}
            sub="Lead created ÷ button clicks (30d)"
          />
          <MetricCard
            label="Listing approval"
            value={`${metrics.conversion.listingApprovalRate}%`}
            sub="Approved ÷ submitted this month"
          />
          <MetricCard
            label="Payment success"
            value={`${metrics.conversion.paymentSuccessRate}%`}
            sub="Successful ÷ attempted this month"
          />
          <MetricCard
            label="Agent signups"
            value={`${metrics.conversion.agentSignupShare}%`}
            sub="New agents ÷ new users this month"
          />
        </div>
      </section>
    </div>
  );
}
