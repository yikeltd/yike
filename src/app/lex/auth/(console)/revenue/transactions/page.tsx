import { AdminPaymentsPanel } from "@/components/admin/admin-payments-panel";
import { AdminSectionTabs } from "@/components/admin/shell/admin-section-tabs";
import { REVENUE_SECTION_TABS } from "@/lib/admin/navigation";
import { isFeaturedPaymentsEnabled } from "@/lib/feature-flags";
import { isPaystackConfigured } from "@/lib/payments/config";

export default function RevenueTransactionsPage() {
  const paymentsLive = isFeaturedPaymentsEnabled() && isPaystackConfigured();

  return (
    <div className="space-y-6">
      <AdminSectionTabs tabs={REVENUE_SECTION_TABS} />
      <section>
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-sm text-muted">
          Paystack transactions · webhook audit · payments {paymentsLive ? "live" : "offline"}
        </p>
      </section>
      <AdminPaymentsPanel />
    </div>
  );
}
