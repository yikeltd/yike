import { redirect } from "next/navigation";
import { getProfile, getSession } from "@/lib/auth";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminSectionTabs } from "@/components/admin/shell/admin-section-tabs";
import { TRUST_SECTION_TABS } from "@/lib/admin/navigation";
import { AdminVerificationControlPanel } from "@/components/admin/admin-verification-control-panel";
import { canManageVerificationControl } from "@/lib/verification/admin-permissions";

export default async function VerificationControlPage() {
  const user = await getSession();
  if (!user) redirect("/lex/auth");

  const profile = await getProfile(user.id);
  if (!profile) redirect("/lex/auth");

  const allowed = await canManageVerificationControl(user.id, profile.role);
  if (!allowed) redirect("/lex/auth/overview");

  return (
    <div className="space-y-6">
      <AdminSectionTabs tabs={TRUST_SECTION_TABS} />
      <AdminPageHeader
        title="Verification Control Center"
        description="Dynamic trust enforcement — global toggles, targeted escalation, and operational anti-fraud controls"
      />
      <AdminVerificationControlPanel />
    </div>
  );
}
