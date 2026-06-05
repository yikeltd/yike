import { requireServerClient } from "@/lib/supabase/require-client";
import { AgentActions } from "@/components/admin/agent-actions";
import { StatusBadge } from "@/components/ui/badge";
import type { Profile, AgentVerification } from "@/types/database";

export default async function AdminAgentsPage() {
  const supabase = await requireServerClient();

  const { data: verifications } = await supabase
    .from("agent_verifications")
    .select(`*, agent:profiles!agent_verifications_agent_id_fkey (*)`)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const { data: agents } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "agent")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold">Pending verifications</h1>
        <ul className="mt-4 space-y-4">
          {(verifications ?? []).map((v) => {
            const row = v as AgentVerification & { agent: Profile };
            return (
              <li
                key={row.id}
                className="rounded-xl border border-border bg-white p-4"
              >
                <p className="font-semibold">{row.agent?.full_name}</p>
                <p className="text-sm text-muted">{row.agent?.phone}</p>
                {row.id_document_url && (
                  <a
                    href={row.id_document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary"
                  >
                    View ID
                  </a>
                )}
                <div className="mt-3">
                  <AgentActions
                    agentId={row.agent_id}
                    verificationId={row.id}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">All agents</h2>
        <ul className="mt-4 space-y-2">
          {(agents ?? []).map((a) => {
            const agent = a as Profile;
            return (
              <li
                key={agent.id}
                className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium">{agent.full_name}</p>
                  <StatusBadge status={agent.verification_status} />
                </div>
                <AgentActions agentId={agent.id} />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
