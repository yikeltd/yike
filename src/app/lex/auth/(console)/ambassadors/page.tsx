import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminAmbassadorsBoard } from "@/components/admin/admin-ambassadors-board";

export default function AdminAmbassadorsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Ambassadors"
        description="City growth partners — applications, slots, commissions, and payouts"
      />
      <AdminAmbassadorsBoard />
    </div>
  );
}
