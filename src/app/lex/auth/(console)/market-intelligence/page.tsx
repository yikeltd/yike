import Link from "next/link";
import { requireServerClient } from "@/lib/supabase/require-client";
import { AdminPageHeader, MetricCard } from "@/components/admin/dashboard/admin-ui";
import { adminPath } from "@/lib/admin-paths";
import { formatPrice } from "@/lib/utils";
import type { Property } from "@/types/database";

export default async function MarketIntelligencePage() {
  const supabase = await requireServerClient();

  const [
    memoryCount,
    highConfidence,
    priceWarnings,
    underpriced,
    overpriced,
    lowData,
    topMemory,
    warningListings,
  ] = await Promise.all([
    supabase
      .from("market_price_memory")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("market_price_memory")
      .select("*", { count: "exact", head: true })
      .eq("confidence_level", "high"),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .in("price_review_status", ["admin_review", "needs_confirmation"]),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .in("price_anomaly_level", ["unusually_low", "slightly_low"]),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .in("price_anomaly_level", ["unusually_high", "high", "slightly_high"]),
    supabase
      .from("market_price_memory")
      .select("*", { count: "exact", head: true })
      .eq("confidence_level", "low")
      .lt("sample_count", 5),
    supabase
      .from("market_price_memory")
      .select("state, city, area, property_type, listing_purpose, median_price, sample_count, confidence_level")
      .gte("sample_count", 8)
      .order("sample_count", { ascending: false })
      .limit(12),
    supabase
      .from("properties")
      .select("id, title, city, area, price, price_anomaly_level, price_review_status, price_anomaly_reason")
      .in("price_anomaly_level", ["unusually_low", "unusually_high", "high"])
      .order("updated_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Market intelligence"
        description="Internal pricing memory and soft anomaly signals — never shown publicly"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Price memory rows" value={memoryCount.count ?? 0} />
        <MetricCard label="High-confidence areas" value={highConfidence.count ?? 0} variant="success" />
        <MetricCard
          label="Pricing warnings"
          value={priceWarnings.count ?? 0}
          href={adminPath("pricing-warnings")}
          variant={(priceWarnings.count ?? 0) > 0 ? "warning" : "default"}
        />
        <MetricCard label="Low-data areas" value={lowData.count ?? 0} />
        <MetricCard label="Underpriced flags" value={underpriced.count ?? 0} />
        <MetricCard label="High-price flags" value={overpriced.count ?? 0} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
          Strong market data
        </h2>
        <ul className="space-y-2">
          {(topMemory.data ?? []).map((row) => (
            <li
              key={`${row.state}-${row.area}-${row.property_type}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm"
            >
              <span className="font-medium text-navy">
                {row.property_type} · {row.area ?? row.city}, {row.state}
              </span>
              <span className="text-muted">
                {row.sample_count} samples · median{" "}
                {row.median_price ? formatPrice(Number(row.median_price)) : "—"} ·{" "}
                {row.confidence_level}
              </span>
            </li>
          ))}
          {(topMemory.data ?? []).length === 0 && (
            <p className="text-sm text-muted">Run market recalculation cron to populate memory.</p>
          )}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
          Listings needing price review
        </h2>
        <ul className="space-y-2">
          {(warningListings.data ?? []).map((p) => {
            const row = p as Pick<
              Property,
              | "id"
              | "title"
              | "city"
              | "area"
              | "price"
              | "price_anomaly_level"
              | "price_review_status"
              | "price_anomaly_reason"
            >;
            return (
              <li
                key={row.id}
                className="rounded-xl border border-border bg-white px-4 py-3 text-sm"
              >
                <Link href={`/lex/auth/listings/${row.id}`} className="font-semibold text-navy">
                  {row.title}
                </Link>
                <p className="text-xs text-muted">
                  {row.city} · {row.area} · {formatPrice(Number(row.price))} ·{" "}
                  {row.price_anomaly_level} · {row.price_review_status}
                </p>
                {row.price_anomaly_reason ? (
                  <p className="mt-1 text-xs text-muted">{row.price_anomaly_reason}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
