import Link from "next/link";
import { requireServerClient } from "@/lib/supabase/require-client";
import { adminPath } from "@/lib/admin-paths";
import { AdminPageHeader, MetricCard } from "@/components/admin/dashboard/admin-ui";
import { OPEN_REPORT_STATUSES } from "@/lib/constants";
import { offsetDaysIso } from "@/lib/time";

export default async function AdminOperationsPage() {
  const supabase = await requireServerClient();
  const now = new Date().toISOString();
  const inThreeDays = offsetDaysIso(3);
  const lastSevenDays = offsetDaysIso(-7);

  const [
    openReports,
    duplicateFlags,
    moderationQueue,
    expiringSoon,
    suspendedAgents,
    boostedListings,
    leadSnapshot,
    pricingWarnings,
  ] = await Promise.all([
    supabase
      .from("listing_reports")
      .select("*", { count: "exact", head: true })
      .in("status", [...OPEN_REPORT_STATUSES]),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("possible_duplicate", true)
      .gte("duplicate_confidence_score", 0.65),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .in("moderation_state", ["pending_review", "flagged", "under_investigation"]),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .gt("expires_at", now)
      .lte("expires_at", inThreeDays),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("account_status", "suspended"),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("is_boosted", true),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", lastSevenDays),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .in("price_review_status", ["admin_review", "needs_confirmation"]),
  ]);

  const sections = [
    {
      title: "Trust & moderation",
      items: [
        { href: adminPath("trust"), label: "Trust Command Center" },
        { href: adminPath("property-verifications"), label: "Property verifications" },
        { href: adminPath("reports"), label: "Reports queue", count: openReports.count ?? 0 },
        { href: adminPath("duplicates"), label: "Duplicate review", count: duplicateFlags.count ?? 0 },
        { href: adminPath("listing-health"), label: "Listing health", count: moderationQueue.count ?? 0 },
        { href: adminPath("company-verification"), label: "Company verification" },
      ],
    },
    {
      title: "Listings lifecycle",
      items: [
        { href: adminPath("expiring-listings"), label: "Expiring soon", count: expiringSoon.count ?? 0 },
        { href: adminPath("listings"), label: "All listings" },
        { href: adminPath("agents"), label: "Suspended agents", count: suspendedAgents.count ?? 0 },
      ],
    },
    {
      title: "Growth & leads",
      items: [
        { href: adminPath("featured"), label: "Boost management" },
        { href: adminPath("leads"), label: "Lead analytics (7d)", count: leadSnapshot.count ?? 0 },
        { href: adminPath("trust-metrics"), label: "Trust metrics" },
        { href: adminPath("market-intelligence"), label: "Market intelligence" },
        { href: adminPath("pricing-warnings"), label: "Pricing warnings", count: pricingWarnings.count ?? 0 },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Operations"
        description="Marketplace trust, moderation, and lifecycle controls"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Open reports"
          value={openReports.count ?? 0}
          href={adminPath("reports")}
          variant={(openReports.count ?? 0) > 0 ? "danger" : "default"}
        />
        <MetricCard
          label="Duplicate flags"
          value={duplicateFlags.count ?? 0}
          href={adminPath("duplicates")}
        />
        <MetricCard
          label="Expiring (3 days)"
          value={expiringSoon.count ?? 0}
          href={adminPath("expiring-listings")}
          variant={(expiringSoon.count ?? 0) > 0 ? "warning" : "default"}
        />
        <MetricCard
          label="Active boosts"
          value={boostedListings.count ?? 0}
          href={adminPath("featured")}
        />
      </div>

      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
            {section.title}
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {section.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="pressable flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-navy"
                >
                  <span>{item.label}</span>
                  {"count" in item && item.count != null ? (
                    <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted">
                      {item.count}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
