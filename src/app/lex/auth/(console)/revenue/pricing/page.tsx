import { RevenuePricingBoard } from "@/components/admin/revenue-pricing-board";
import { AdminSectionTabs } from "@/components/admin/shell/admin-section-tabs";
import { REVENUE_SECTION_TABS } from "@/lib/admin/navigation";

export default function RevenuePricingPage() {
  return (
    <div className="space-y-6">
      <AdminSectionTabs tabs={REVENUE_SECTION_TABS} />
      <section>
        <h1 className="text-2xl font-bold">Revenue pricing</h1>
        <p className="text-sm text-muted">
          Control all paid product prices from one place. Changes apply immediately — no code deploy or SQL.
        </p>
      </section>
      <RevenuePricingBoard />
    </div>
  );
}
