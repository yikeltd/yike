import { SellerVerificationsBoard } from "@/components/admin/seller-verifications-board";
import { AdminSectionTabs } from "@/components/admin/shell/admin-section-tabs";
import { TRUST_SECTION_TABS } from "@/lib/admin/navigation";

export default function VerificationRequestsPage() {
  return (
    <div className="space-y-6">
      <AdminSectionTabs tabs={TRUST_SECTION_TABS} />
      <section>
        <h1 className="text-2xl font-bold">Verification requests</h1>
        <p className="text-sm text-muted">
          Business Verified applications · ₦4,999 review fee
        </p>
      </section>
      <SellerVerificationsBoard />
    </div>
  );
}
