import { requireDealMatchingAccess } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/admin/roles";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { DealMatchingBoard } from "@/components/admin/deal-matching-board";

export default async function DealMatchingPage() {
  const { profile } = await requireDealMatchingAccess();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Deal Matching"
        description="Private high-intent deal flow — curated outreach, WhatsApp coordination, commission tracking. Not public."
      />
      <DealMatchingBoard isSuperAdmin={isSuperAdmin(profile.role)} />
    </div>
  );
}
