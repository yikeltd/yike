import { requireAdmin } from "@/lib/auth";
import { authNavAllowlist } from "@/lib/admin/roles";
import {
  AUTH_NAV_GROUPS,
  filterNavForRole,
} from "@/lib/admin/navigation";
import { AdminShell } from "@/components/admin/shell/admin-shell";

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAdmin();
  const allowlist = authNavAllowlist(profile.role);
  const groups = filterNavForRole(AUTH_NAV_GROUPS, allowlist);

  return (
    <AdminShell
      console="auth"
      groups={groups}
      role={profile.role}
      displayName={profile.full_name ?? profile.email ?? "Staff"}
      lastLoginAt={profile.last_login_at}
    >
      {children}
    </AdminShell>
  );
}
