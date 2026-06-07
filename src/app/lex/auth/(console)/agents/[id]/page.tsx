import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAdminProfileStats } from "@/lib/admin/profile-stats";
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

  const stats = await fetchAdminProfileStats(supabase, id);

  const { data: verification } = await supabase
    .from("agent_verifications")
    .select("id, status")
    .eq("agent_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <>
      <AdminUserDetail
        profile={agent as Profile}
        stats={stats}
        backHref="/lex/auth/agents"
        backLabel="All agents"
        showListingLimit
      />
      {verification && (
        <div className="-mt-4">
          <AdminAgentVerificationSection
            agentId={id}
            verificationId={verification.id}
          />
        </div>
      )}
    </>
  );
}
