import { requireAdmin } from "@/lib/auth";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminSectionTabs } from "@/components/admin/shell/admin-section-tabs";
import { TRUST_SECTION_TABS } from "@/lib/admin/navigation";
import { AdminAuthSecurityEventsBoard } from "@/components/admin/admin-auth-security-events-board";

export default async function AuthSecurityEventsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <AdminSectionTabs tabs={TRUST_SECTION_TABS} />
      <AdminPageHeader
        title="Auth security events"
        description="Login, PIN, device, session, and sensitive-action activity — staff only."
      />
      <AdminAuthSecurityEventsBoard />
    </div>
  );
}
