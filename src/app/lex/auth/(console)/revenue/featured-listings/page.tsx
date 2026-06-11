import { FeaturedPromotionsBoard } from "@/components/admin/featured-promotions-board";
import { AdminSectionTabs } from "@/components/admin/shell/admin-section-tabs";
import { REVENUE_SECTION_TABS } from "@/lib/admin/navigation";
import { isFeaturedPaymentsEnabled } from "@/lib/feature-flags";

export default function RevenueFeaturedListingsPage() {
  const paymentsOn = isFeaturedPaymentsEnabled();

  return (
    <div className="space-y-6">
      <AdminSectionTabs tabs={REVENUE_SECTION_TABS} />
      <section>
        <h1 className="text-2xl font-bold">Featured listings</h1>
        <p className="text-sm text-muted">
          Promotion orders · manual activation while payments are{" "}
          {paymentsOn ? "live" : "offline"}
        </p>
        {!paymentsOn ? (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Payment integration coming online. Use Activate on pending orders for testing.
          </p>
        ) : null}
      </section>
      <FeaturedPromotionsBoard />
    </div>
  );
}
