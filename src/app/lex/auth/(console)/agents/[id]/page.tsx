import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAdminProfileStats } from "@/lib/admin/profile-stats";
import { fetchUserAuditLogs } from "@/lib/admin/user-audit";
import { notFound } from "next/navigation";
import { AdminUserDetail } from "@/components/admin/admin-user-detail";
import { AdminAgentVerificationSection } from "@/components/admin/admin-agent-verification-section";
import type { Profile } from "@/types/database";

export default async function AdminAgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();
  if (!supabase) notFound();

  const { data: agent } = await supabase.from("profiles").select("*").eq("id", id).single();

  if (!agent) notFound();

  const [stats, auditLogs, listingsResult, verificationResult] = await Promise.all([
    fetchAdminProfileStats(supabase, id),
    fetchUserAuditLogs(supabase, id),
    supabase
      .from("properties")
      .select("id, title, status, city")
      .eq("agent_id", id)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("agent_verifications")
      .select("id, status")
      .eq("agent_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const verification = verificationResult.data;

  return (
    <AdminUserDetail
      profile={agent as Profile}
      stats={stats}
      backHref="/lex/auth/agents"
      backLabel="All agents"
      showListingLimit
      auditLogs={auditLogs}
      listings={listingsResult.data ?? []}
      verificationSection={
        verification ? (
          <AdminAgentVerificationSection agentId={id} verificationId={verification.id} />
        ) : undefined
      }
    />
  );
}
