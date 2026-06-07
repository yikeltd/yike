import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminLegalPartnersBoard } from "@/components/admin/admin-legal-partners-board";

export default function AdminLegalPartnersPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Legal Verification Partners"
        description="Independent legal review network — applications, assignments, reports, fraud review"
      />
      <AdminLegalPartnersBoard />
    </div>
  );
}
