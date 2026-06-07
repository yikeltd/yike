import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminAmbassadorPayoutsBoard } from "@/components/admin/admin-ambassador-payouts-board";

export default function AdminAmbassadorPayoutsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Ambassador Payouts"
        description="Review bank details, approve payouts manually, and hold or freeze when needed"
      />
      <AdminAmbassadorPayoutsBoard />
    </div>
  );
}
