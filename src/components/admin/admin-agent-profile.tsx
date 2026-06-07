"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePinGate } from "@/components/admin/pin-confirm-modal";
import {
  AgentStatusActions,
  AgentVerificationActions,
} from "@/components/admin/agent-verification-actions";
import { AgentLeadRoutingPanel } from "@/components/admin/agent-lead-routing-panel";
import { StatusBadge, VerifiedBadge } from "@/components/ui/badge";
import { isVerifiedAgentProfile, UNVERIFIED_AGENT_LISTING_LIMIT } from "@/lib/agent-tiers";

type AgentStats = {
  active_listing_count: number;
  total_listings: number;
  leads: number;
  reviews: number;
  reports: number;
};

export function AdminAgentProfile({
  agent,
  stats,
  verification,
}: {
  agent: Profile;
  stats: AgentStats;
  verification?: { id: string; status: string } | null;
}) {
  const router = useRouter();
  const { requirePin, pinModal } = usePinGate();
  const [listingLimit, setListingLimit] = useState<string>(
    agent.listing_limit === null || agent.listing_limit === undefined
      ? ""
      : String(agent.listing_limit)
  );
  const [unlimited, setUnlimited] = useState(agent.listing_limit === null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function saveLimit() {
    setBusy(true);
    setMessage("");
    const res = await fetch(`/api/admin/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listing_limit: unlimited ? null : Number(listingLimit) || UNVERIFIED_AGENT_LISTING_LIMIT,
      }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMessage(data.error ?? "Update failed");
      return;
    }
    setMessage("Listing limit updated");
    router.refresh();
  }

  return (
    <div className="space-y-8 pb-12">
      {pinModal}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/lex/auth/agents" className="text-xs font-bold text-gold-dark">
            ← All agents
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-navy">{agent.full_name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status={agent.role} />
            {isVerifiedAgentProfile(agent) ? (
              <VerifiedBadge />
            ) : (
              <StatusBadge status={agent.verification_status} />
            )}
            {agent.profile_status && (
              <StatusBadge status={agent.profile_status} />
            )}
          </div>
        </div>
        <AgentStatusActions agentId={agent.id} />
      </div>

      {message && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Active listings", stats.active_listing_count],
          ["Total listings", stats.total_listings],
          ["Leads", stats.leads],
          ["Reviews", stats.reviews],
        ].map(([label, value]) => (
          <div
            key={label as string}
            className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm"
          >
            <p className="text-2xl font-black text-navy tabular-nums">{value}</p>
            <p className="text-xs font-semibold text-muted">{label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm space-y-4">
        <h2 className="font-bold text-navy">Contact & plan</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="font-medium">{agent.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Phone</dt>
            <dd className="font-medium">{agent.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">WhatsApp</dt>
            <dd className="font-medium">{agent.whatsapp ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Plan</dt>
            <dd className="font-medium">{agent.plan ?? "free"}</dd>
          </div>
        </dl>
      </section>

      <AgentLeadRoutingPanel agentId={agent.id} />

      <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm space-y-4">
        <h2 className="font-bold text-navy">Listing limit control</h2>
        <p className="text-sm text-muted">
          Unverified default: {UNVERIFIED_AGENT_LISTING_LIMIT}. Verified agents can have
          unlimited listings (null limit).
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={unlimited}
            onChange={(e) => setUnlimited(e.target.checked)}
          />
          Unlimited listings
        </label>
        {!unlimited && (
          <label className="block text-sm max-w-xs">
            <span className="font-semibold">Max active listings</span>
            <Input
              type="number"
              min={0}
              value={listingLimit}
              onChange={(e) => setListingLimit(e.target.value)}
              className="mt-1"
            />
          </label>
        )}
        <Button disabled={busy} onClick={() => requirePin(() => saveLimit())}>
          Save listing limit (PIN required)
        </Button>
      </section>

      {verification && (
        <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-bold text-navy">Verification</h2>
          <AgentVerificationActions
            verificationId={verification.id}
            agentId={agent.id}
          />
        </section>
      )}

      <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm space-y-3">
        <h2 className="font-bold text-navy">Quick links</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/lex/auth/listings?agent=${agent.id}`}
            className="rounded-lg bg-surface px-4 py-2 text-xs font-bold text-navy"
          >
            View listings
          </Link>
          <Link
            href={`/lex/auth/leads?agent=${agent.id}`}
            className="rounded-lg bg-surface px-4 py-2 text-xs font-bold text-navy"
          >
            View leads
          </Link>
          <Link
            href={`/lex/auth/reviews?agent_id=${agent.id}`}
            className="rounded-lg bg-surface px-4 py-2 text-xs font-bold text-navy"
          >
            View reviews
          </Link>
        </div>
      </section>
    </div>
  );
}
