import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAdminProfileStats } from "@/lib/admin/profile-stats";
import { fetchUserAuditLogs } from "@/lib/admin/user-audit";
import { getSession, getProfile } from "@/lib/auth";
import { canViewAccounts, getActiveSupportView } from "@/lib/admin/support-view";
import { notFound } from "next/navigation";
import { AdminUserDetail } from "@/components/admin/admin-user-detail";
import type { Profile } from "@/types/database";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();
  if (!supabase) notFound();

  const session = await getSession();
  const staffProfile = session ? await getProfile(session.id) : null;
  const canView =
    staffProfile != null
      ? await canViewAccounts(staffProfile.id, staffProfile.role)
      : false;
  const supportViewSession =
    staffProfile != null ? await getActiveSupportView(staffProfile.id) : null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", id).single();

  if (!profile) notFound();

  const isAgent =
    profile.role === "agent_unverified" ||
    profile.role === "agent_verified" ||
    profile.role === "agent";

  const [stats, auditLogs, listingsResult] = await Promise.all([
    fetchAdminProfileStats(supabase, id),
    fetchUserAuditLogs(supabase, id),
    isAgent
      ? supabase
          .from("properties")
          .select("id, title, status, city")
          .eq("agent_id", id)
          .order("created_at", { ascending: false })
          .limit(12)
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <AdminUserDetail
      profile={profile as Profile}
      stats={stats}
      backHref="/lex/auth/users"
      backLabel="All users"
      showListingLimit={isAgent}
      auditLogs={auditLogs}
      listings={listingsResult.data ?? []}
      canViewAccounts={canView}
      supportViewSession={supportViewSession}
    />
  );
}
