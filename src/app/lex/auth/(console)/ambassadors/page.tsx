import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminSectionTabs } from "@/components/admin/shell/admin-section-tabs";
import { PARTNERS_SECTION_TABS } from "@/lib/admin/navigation";
import { AdminAmbassadorsBoard } from "@/components/admin/admin-ambassadors-board";

export default function AdminAmbassadorsPage() {
  return (
    <div className="space-y-6">
      <AdminSectionTabs tabs={PARTNERS_SECTION_TABS} />
      <AdminPageHeader
        title="Ambassadors"
        description="City growth partners — applications, slots, commissions, and payouts"
      />
      <AdminAmbassadorsBoard />
    </div>
  );
}
