import { requireTechConsole } from "@/lib/auth";
import { TECH_NAV_GROUPS } from "@/lib/admin/navigation";
import { AdminShell } from "@/components/admin/shell/admin-shell";

export default async function TechConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireTechConsole();

  return (
    <AdminShell
      console="tech"
      groups={TECH_NAV_GROUPS}
      role={profile.role}
      displayName={profile.full_name ?? profile.email ?? "Tech"}
      lastLoginAt={profile.last_login_at}
    >
      {children}
    </AdminShell>
  );
}
