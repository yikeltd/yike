import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminSectionTabs } from "@/components/admin/shell/admin-section-tabs";
import { TRUST_SECTION_TABS } from "@/lib/admin/navigation";
import { AdminTrustCommandCenter } from "@/components/admin/admin-trust-command-center";

export default function TrustCommandCenterPage() {
  return (
    <div className="space-y-6">
      <AdminSectionTabs tabs={TRUST_SECTION_TABS} />
      <AdminPageHeader
        title="Trust Command Center"
        description="Unified trust operations — verification requests, partners, fraud review, diaspora pipeline, escalations"
      />
      <AdminTrustCommandCenter />
    </div>
  );
}
