import { requireAdmin } from "@/lib/auth";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminAuthSecurityEventsBoard } from "@/components/admin/admin-auth-security-events-board";

export default async function AuthSecurityEventsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Auth security events"
        description="Login, PIN, device, session, and sensitive-action activity — staff only."
      />
      <AdminAuthSecurityEventsBoard />
    </div>
  );
}
