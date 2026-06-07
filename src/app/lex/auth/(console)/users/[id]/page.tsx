import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAdminProfileStats } from "@/lib/admin/profile-stats";
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

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", id).single();

  if (!profile) notFound();

  const stats = await fetchAdminProfileStats(supabase, id);
  const isAgent =
    profile.role === "agent_unverified" ||
    profile.role === "agent_verified" ||
    profile.role === "agent";

  return (
    <AdminUserDetail
      profile={profile as Profile}
      stats={stats}
      backHref="/lex/auth/users"
      backLabel="All users"
      showListingLimit={isAgent}
    />
  );
}
