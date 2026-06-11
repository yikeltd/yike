import { SubscriptionsBoard } from "@/components/admin/subscriptions-board";
import { AdminSectionTabs } from "@/components/admin/shell/admin-section-tabs";
import { REVENUE_SECTION_TABS } from "@/lib/admin/navigation";

export default function SubscriptionsAdminPage() {
  return (
    <div className="space-y-6">
      <AdminSectionTabs tabs={REVENUE_SECTION_TABS} />
      <section>
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="text-sm text-muted">
          Active, expired, and cancelled seller plans. Manual renewal only — no auto-charge.
        </p>
      </section>
      <SubscriptionsBoard />
    </div>
  );
}
