import { requireServerClient } from "@/lib/supabase/require-client";
import { AgentActions } from "@/components/admin/agent-actions";
import {
  AgentVerificationActions,
  AgentStatusActions,
} from "@/components/admin/agent-verification-actions";
import { StatusBadge, VerifiedBadge } from "@/components/ui/badge";
import { isVerifiedAgentProfile } from "@/lib/agent-tiers";
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
    .in("role", ["agent_unverified", "agent_verified"])
    .order("created_at", { ascending: false })
    .limit(40);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold">Pending verifications</h1>
        <p className="mt-1 text-sm text-muted">
          Manual review — NIN and selfie are encrypted. Verification call happens on WhatsApp (+2348035143299).
        </p>
        <ul className="mt-4 space-y-4">
          {(verifications ?? []).map((v) => {
            const row = v as AgentVerification & { agent: Profile };
            return (
              <li
                key={row.id}
                className="rounded-xl border border-border bg-white p-4"
              >
                <p className="font-semibold">{row.full_name ?? row.agent?.full_name}</p>
                <p className="text-sm text-muted">
                  {row.city}, {row.state} · {row.agent?.phone}
                </p>
                {row.selfie_url && (
                  <a
                    href={row.selfie_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary"
                  >
                    View selfie
                  </a>
                )}
                {row.id_document_url && (
                  <>
                    {" · "}
                    <a
                      href={row.id_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary"
                    >
                      View ID
                    </a>
                  </>
                )}
                <div className="mt-3">
                  <AgentVerificationActions
                    verificationId={row.id}
                    agentId={row.agent_id}
                    verification={row}
                  />
                  <div className="mt-2">
                    <AgentActions
                      agentId={row.agent_id}
                      verificationId={row.id}
                      listingLimit={row.agent?.listing_limit}
                    />
                  </div>
                </div>
              </li>
            );
          })}
          {(verifications ?? []).length === 0 && (
            <p className="text-sm text-muted">No pending applications.</p>
          )}
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
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium">{agent.full_name}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span className="text-xs text-muted">{agent.role}</span>
                    {isVerifiedAgentProfile(agent) ? (
                      <VerifiedBadge />
                    ) : (
                      <StatusBadge status={agent.verification_status} />
                    )}
                  </div>
                </div>
                <AgentStatusActions agentId={agent.id} />
                <div className="mt-2">
                  <AgentActions
                    agentId={agent.id}
                    listingLimit={agent.listing_limit}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
