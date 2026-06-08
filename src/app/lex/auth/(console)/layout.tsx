import { requireAdmin } from "@/lib/auth";
import { authNavAllowlist } from "@/lib/admin/roles";
import {
  AUTH_NAV_GROUPS,
  filterNavForRole,
} from "@/lib/admin/navigation";
import { fetchAdminNavBadges } from "@/lib/admin/nav-badges";
import { AdminShell } from "@/components/admin/shell/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAdmin();
  const allowlist = authNavAllowlist(profile.role);
  const groups = filterNavForRole(AUTH_NAV_GROUPS, allowlist);
  const badges = allowlist === null ? await fetchAdminNavBadges() : {};

  return (
    <AdminShell
      console="auth"
      groups={groups}
      badges={badges}
      role={profile.role}
      displayName={profile.full_name ?? profile.email ?? "Staff"}
      lastLoginAt={profile.last_login_at}
    >
      {children}
    </AdminShell>
  );
}
