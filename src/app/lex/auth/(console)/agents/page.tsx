import { createAdminClient } from "@/lib/supabase/admin";
import { AgentVerificationActions, AgentStatusActions } from "@/components/admin/agent-verification-actions";
import { normalizeAccountStatus } from "@/lib/account-control";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { StatusBadge, VerifiedBadge } from "@/components/ui/badge";
import { SellerTrustBadge } from "@/components/marketplace/seller-trust-badge";
import { isVerifiedAgentProfile } from "@/lib/agent-tiers";
import { parseAdminPage } from "@/lib/admin/pagination";
import {
  deriveSellerLaunchStatus,
  SELLER_DB_STATUS_LABELS,
  SELLER_LAUNCH_STATUS_LABELS,
} from "@/lib/seller-trust";
import type { Profile, AgentVerification } from "@/types/database";
import Link from "next/link";

function formatDob(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(`${value}T12:00:00Z`).toLocaleDateString(undefined, {
      dateStyle: "medium",
    });
  } catch {
    return value;
  }
}

function formatRegDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return value;
  }
}

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
    .in("role", ["agent", "agent_unverified", "agent_verified"])
    .order("created_at", { ascending: false })
    .range(from, to);

  const queueAgentIds = (verifications ?? []).map(
    (v) => (v as AgentVerification).agent_id
  );
  const agentIds = [
    ...new Set([
      ...queueAgentIds,
      ...(agents ?? []).map((a) => (a as Profile).id),
    ]),
  ];
  const listingCounts = new Map<string, number>();
  if (agentIds.length > 0) {
    const { data: listingRows } = await supabase
      .from("properties")
      .select("agent_id")
      .in("agent_id", agentIds)
      .in("status", ["pending", "approved", "flagged"]);
    for (const row of listingRows ?? []) {
      const id = String((row as { agent_id: string }).agent_id);
      listingCounts.set(id, (listingCounts.get(id) ?? 0) + 1);
    }
  }

  const total = count ?? 0;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold">Seller verification queue</h1>
        <p className="mt-1 text-sm text-muted">
          Manual Yike review — photo, identity, address, DOB, and contact. Phone alone
          does not grant Verified Seller. Approve / Reject / Request more info / Suspend
          are audited.
        </p>
        <ul className="mt-4 space-y-4">
          {(verifications ?? []).map((v) => {
            const row = v as AgentVerification & { agent: Profile };
            const agent = row.agent;
            const launchStatus = deriveSellerLaunchStatus(agent);
            const state =
              row.state ?? agent?.residential_state ?? null;
            const address =
              row.residential_address ??
              agent?.residential_address ??
              agent?.office_address ??
              null;
            const dob = row.date_of_birth ?? agent?.date_of_birth ?? null;
            const phone = agent?.phone ?? row.phone ?? agent?.whatsapp ?? null;
            const email = agent?.email ?? row.email ?? null;
            const photo = agent?.avatar_url ?? row.selfie_url ?? null;
            const notes =
              row.verification_notes ?? agent?.verification_notes ?? null;

            return (
              <li
                key={row.id}
                className="rounded-xl border border-border bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface">
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs font-bold text-muted">
                          {(row.full_name ?? agent?.full_name ?? "?").slice(0, 1)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/lex/auth/agents/${row.agent_id}`}
                        className="font-semibold text-navy hover:text-gold-dark"
                      >
                        {row.full_name ?? agent?.full_name}
                      </Link>
                      <p className="mt-0.5 text-sm text-muted">
                        {email ?? "—"}
                        {phone ? ` · ${phone}` : ""}
                      </p>
                      <dl className="mt-2 grid gap-1 text-xs text-navy/80 sm:grid-cols-2">
                        <div>
                          <dt className="inline font-semibold text-muted">Status: </dt>
                          <dd className="inline">
                            {SELLER_DB_STATUS_LABELS[launchStatus]} (
                            {SELLER_LAUNCH_STATUS_LABELS[launchStatus]})
                          </dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold text-muted">State: </dt>
                          <dd className="inline">{state || "—"}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="inline font-semibold text-muted">Address: </dt>
                          <dd className="inline">{address || "—"}</dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold text-muted">DOB: </dt>
                          <dd className="inline">{formatDob(dob)}</dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold text-muted">Reg date: </dt>
                          <dd className="inline">
                            {formatRegDate(agent?.created_at ?? row.submitted_at)}
                          </dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold text-muted">Listings: </dt>
                          <dd className="inline">
                            {listingCounts.get(row.agent_id) ?? 0}
                          </dd>
                        </div>
                        {row.occupation ? (
                          <div>
                            <dt className="inline font-semibold text-muted">Occupation: </dt>
                            <dd className="inline">{row.occupation}</dd>
                          </div>
                        ) : null}
                      </dl>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <SellerTrustBadge profile={agent} size="sm" />
                        <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted">
                          Email: {agent?.email_verified ? "✓" : "—"}
                        </span>
                        <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted">
                          Phone:{" "}
                          {agent?.phone_verified ||
                          agent?.whatsapp_verification_status === "verified"
                            ? "✓"
                            : "—"}
                        </span>
                        <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted">
                          Profile:{" "}
                          {agent?.seller_profile_completed_at ||
                          (agent?.date_of_birth && agent?.residential_state)
                            ? "✓"
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <AgentStatusActions agentId={row.agent_id} />
                </div>
                {row.selfie_url && row.selfie_url !== photo ? (
                  <a
                    href={row.selfie_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary"
                  >
                    View selfie
                  </a>
                ) : null}
                {row.id_document_url ? (
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
                ) : null}
                {notes ? (
                  <p className="mt-2 text-xs text-muted">Notes: {notes}</p>
                ) : null}
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
            <p className="text-sm text-muted">No pending seller applications.</p>
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">All sellers</h2>
        <p className="text-sm text-muted">{total} sellers</p>
        <ul className="mt-4 space-y-2">
          {(agents ?? []).map((a) => {
            const agent = a as Profile;
            const launchStatus = deriveSellerLaunchStatus(agent);
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
                      Listings: {listingCounts.get(agent.id) ?? 0}
                    </span>
                    <span className="text-xs text-muted">
                      Limit: {agent.listing_limit ?? "∞"}
                    </span>
                    <span className="text-xs text-muted">
                      {agent.residential_state ?? "—"}
                    </span>
                    <SellerTrustBadge profile={agent} size="sm" />
                    <span className="text-[10px] font-semibold text-muted">
                      {SELLER_DB_STATUS_LABELS[launchStatus]}
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
