import { requireSupportConsole } from "@/lib/auth";
import { SUPPORT_NAV_GROUPS } from "@/lib/admin/navigation";
import { AdminShell } from "@/components/admin/shell/admin-shell";

export default async function SupportConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireSupportConsole();

  return (
    <AdminShell
      console="support"
      groups={SUPPORT_NAV_GROUPS}
      role={profile.role}
      displayName={profile.full_name ?? profile.email ?? "Support"}
      lastLoginAt={profile.last_login_at}
    >
      {children}
    </AdminShell>
  );
}
