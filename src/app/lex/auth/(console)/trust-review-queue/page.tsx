import { redirect } from "next/navigation";
import { getProfile, getSession } from "@/lib/auth";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminSectionTabs } from "@/components/admin/shell/admin-section-tabs";
import { TRUST_SECTION_TABS } from "@/lib/admin/navigation";
import { AdminTrustReviewQueueBoard } from "@/components/admin/admin-trust-review-queue-board";
import { canEnforceTrust } from "@/lib/verification/admin-permissions";

export default async function TrustReviewQueuePage() {
  const user = await getSession();
  if (!user) redirect("/lex/auth");

  const profile = await getProfile(user.id);
  if (!profile) redirect("/lex/auth");

  const allowed = await canEnforceTrust(user.id, profile.role);
  if (!allowed) redirect("/lex/auth/overview");
  return (
    <div className="space-y-6">
      <AdminSectionTabs tabs={TRUST_SECTION_TABS} />
      <AdminPageHeader
        title="Trust Review Queue"
        description="Human-guided trust decisions — escalate to verification, reduce restrictions, or resolve without public fraud labels"
      />
      <AdminTrustReviewQueueBoard />
    </div>
  );
}
