import { createAdminClient } from "@/lib/supabase/admin";
import { AgentVerificationActions } from "@/components/admin/agent-verification-actions";
import { normalizeAccountStatus } from "@/lib/account-control";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { StatusBadge, VerifiedBadge } from "@/components/ui/badge";
import { isVerifiedAgentProfile } from "@/lib/agent-tiers";
import { parseAdminPage } from "@/lib/admin/pagination";
import type { Profile, AgentVerification } from "@/types/database";
import Link from "next/link";

export default async function AdminAgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tab?: string }>;
}) {
  const sp = await searchParams;
  const { page, from, to } = parseAdminPage(sp);
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data: verifications } = await supabase
    .from("agent_verifications")
    .select(`*, agent:profiles!agent_verifications_agent_id_fkey (*)`)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .range(from, to);

  const { data: agents, count } = await supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .in("role", ["agent_unverified", "agent_verified"])
    .order("created_at", { ascending: false })
    .range(from, to);

  const total = count ?? 0;

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
                <Link
                  href={`/lex/auth/agents/${row.agent_id}`}
                  className="font-semibold text-navy hover:text-gold-dark"
                >
                  {row.full_name ?? row.agent?.full_name}
                </Link>
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
                  <Link
                    href={`/lex/auth/agents/${row.agent_id}`}
                    className="mt-2 inline-block text-xs font-bold text-gold-dark"
                  >
                    Open full profile →
                  </Link>
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
        <p className="text-sm text-muted">{total} agents</p>
        <ul className="mt-4 space-y-2">
          {(agents ?? []).map((a) => {
            const agent = a as Profile;
            return (
              <li
                key={agent.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-white px-4 py-3"
              >
                <div>
                  <Link
                    href={`/lex/auth/agents/${agent.id}`}
                    className="font-medium text-navy hover:text-gold-dark"
                  >
                    {agent.full_name}
                  </Link>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span className="text-xs text-muted">{agent.role}</span>
                    <span className="text-xs text-muted">
                      Limit: {agent.listing_limit ?? "∞"}
                    </span>
                    {isVerifiedAgentProfile(agent) ? (
                      <VerifiedBadge />
                    ) : (
                      <StatusBadge status={agent.verification_status} />
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={normalizeAccountStatus(agent)} />
                  <Link
                    href={`/lex/auth/agents/${agent.id}`}
                    className="text-xs font-bold text-gold-dark hover:underline"
                  >
                    Manage
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
        <AdminPagination
          basePath="/lex/auth/agents"
          total={total}
          page={page}
          className="mt-4"
        />
      </section>
    </div>
  );
}
