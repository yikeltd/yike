import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminVerifiersBoard } from "@/components/admin/admin-verifiers-board";

export default function AdminVerifiersPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Field Verifiers"
        description="Independent property inspection network — applications, assignments, reports, fraud review"
      />
      <AdminVerifiersBoard />
    </div>
  );
}
