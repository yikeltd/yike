import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminPropertyVerificationsBoard } from "@/components/admin/admin-property-verifications-board";
import { PropertyVerificationOrdersBoard } from "@/components/admin/property-verification-orders-board";

export default function AdminPropertyVerificationsPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <AdminPageHeader
          title="Property Verification Orders"
          description="Paid packages — assign verifiers, upload reports, deliver to customers"
        />
        <PropertyVerificationOrdersBoard />
      </section>
      <section className="space-y-6 border-t border-border pt-8">
        <AdminPageHeader
          title="Intake requests"
          description="Pre-payment and legacy request workflow"
        />
        <AdminPropertyVerificationsBoard />
      </section>
    </div>
  );
}
