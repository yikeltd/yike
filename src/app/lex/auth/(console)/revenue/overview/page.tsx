import { RevenueOverviewPanel } from "@/components/admin/revenue-overview-panel";
import { AdminSectionTabs } from "@/components/admin/shell/admin-section-tabs";
import { REVENUE_SECTION_TABS } from "@/lib/admin/navigation";
import { isFeaturedPaymentsEnabled } from "@/lib/feature-flags";
import { isPaystackConfigured } from "@/lib/payments/config";

export default function RevenueOverviewPage() {
  const paymentsLive = isFeaturedPaymentsEnabled() && isPaystackConfigured();

  return (
    <div className="space-y-6">
      <AdminSectionTabs tabs={REVENUE_SECTION_TABS} />
      <section>
        <h1 className="text-2xl font-bold">Revenue overview</h1>
        <p className="text-sm text-muted">
          Paystack-backed payments · featured listings {paymentsLive ? "live" : "offline"}
        </p>
      </section>
      <RevenueOverviewPanel />
    </div>
  );
}
