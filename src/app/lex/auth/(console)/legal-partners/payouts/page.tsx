import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminLegalPartnerPayoutsBoard } from "@/components/admin/admin-legal-partner-payouts-board";

export default function AdminLegalPartnerPayoutsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Legal Partner Payouts"
        description="Assignment-based earnings, bank reviews, and payout queue"
      />
      <AdminLegalPartnerPayoutsBoard />
    </div>
  );
}
