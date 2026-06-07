import { requireSupportConsole } from "@/lib/auth";
import { SUPPORT_NAV_GROUPS, filterSupportNavForRole } from "@/lib/admin/navigation";
import { AdminShell } from "@/components/admin/shell/admin-shell";

export default async function SupportConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireSupportConsole();
  const groups = filterSupportNavForRole(SUPPORT_NAV_GROUPS, profile.role);

  return (
    <AdminShell
      console="support"
      groups={groups}
      role={profile.role}
      displayName={profile.full_name ?? profile.email ?? "Support"}
      lastLoginAt={profile.last_login_at}
    >
      {children}
    </AdminShell>
  );
}
