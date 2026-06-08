import { requireDealMatchingAccess } from "@/lib/auth";
import {
  AUTH_NAV_GROUPS,
  filterNavForRole,
  SUPPORT_NAV_GROUPS,
} from "@/lib/admin/navigation";
import { authNavAllowlist } from "@/lib/admin/roles";
import { AdminShell } from "@/components/admin/shell/admin-shell";
import { adminPath } from "@/lib/admin-paths";
import type { NavGroup } from "@/lib/admin/navigation";

export const dynamic = "force-dynamic";

function dealMatchingNavGroups(role: string, isSupport: boolean): NavGroup[] {
  const dealItem = {
    href: adminPath("deal-matching"),
    label: "Deal Matching",
    segment: "deal-matching",
  };

  if (isSupport) {
    return [
      {
        id: "ops",
        label: "Operations",
        items: [dealItem],
      },
      ...SUPPORT_NAV_GROUPS,
    ];
  }

  const groups = filterNavForRole(AUTH_NAV_GROUPS, authNavAllowlist(role as Parameters<typeof authNavAllowlist>[0]));
  return groups.map((g) =>
    g.id === "overview"
      ? { ...g, items: [dealItem, ...g.items.filter((i) => i.segment !== "deal-matching")] }
      : g
  );
}

export default async function DealMatchingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireDealMatchingAccess();
  const isSupport = profile.role === "support";
  const groups = dealMatchingNavGroups(profile.role, isSupport);

  return (
    <AdminShell
      console={isSupport ? "support" : "auth"}
      groups={groups}
      role={profile.role}
      displayName={profile.full_name ?? profile.email ?? "Staff"}
      lastLoginAt={profile.last_login_at}
    >
      {children}
    </AdminShell>
  );
}
