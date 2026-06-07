import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminTrustCommandCenter } from "@/components/admin/admin-trust-command-center";

export default function TrustCommandCenterPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Trust Command Center"
        description="Unified trust operations — verification requests, partners, fraud review, diaspora pipeline, escalations"
      />
      <AdminTrustCommandCenter />
    </div>
  );
}
