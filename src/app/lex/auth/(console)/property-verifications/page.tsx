import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminPropertyVerificationsBoard } from "@/components/admin/admin-property-verifications-board";

export default function AdminPropertyVerificationsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Property Verifications"
        description="Buyer requests — contact workflow, verifier assignment, report delivery"
      />
      <AdminPropertyVerificationsBoard />
    </div>
  );
}
