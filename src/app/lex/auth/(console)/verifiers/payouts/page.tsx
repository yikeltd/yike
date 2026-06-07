import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminVerifierPayoutsBoard } from "@/components/admin/admin-verifier-payouts-board";

export default function AdminVerifierPayoutsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Verifier Payouts"
        description="Per-inspection earnings — bank reviews, payout queue, and approvals"
      />
      <AdminVerifierPayoutsBoard />
    </div>
  );
}
