"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function AgentActions({
  agentId,
  verificationId,
  listingLimit,
}: {
  agentId: string;
  verificationId?: string;
  listingLimit?: number | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const supabase = createClient();

  async function verify() {
    setBusy("verify");
    await supabase
      .from("profiles")
      .update({
        role: "agent_verified",
        verification_status: "approved",
        verified_badge: true,
        listing_limit: null,
        ranking_score: 100,
      })
      .eq("id", agentId);
    if (verificationId) {
      await supabase
        .from("agent_verifications")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", verificationId);
    }
    void fetch("/api/notifications/email/agent-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, status: "approved" }),
    });
    setBusy(null);
    router.refresh();
  }

  async function reject() {
    setBusy("reject");
    await supabase
      .from("profiles")
      .update({ verification_status: "rejected", verified_badge: false })
      .eq("id", agentId);
    if (verificationId) {
      await supabase
        .from("agent_verifications")
        .update({
          status: "rejected",
          rejection_reason: "Did not meet verification requirements",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", verificationId);
    }
    void fetch("/api/notifications/email/agent-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId,
        status: "rejected",
        reason: "Did not meet verification requirements",
      }),
    });
    setBusy(null);
    router.refresh();
  }

  async function ban() {
    setBusy("ban");
    await supabase.from("profiles").update({ is_banned: true }).eq("id", agentId);
    setBusy(null);
    router.refresh();
  }

  async function setListingLimit(limit: number | null) {
    setBusy("limit");
    await supabase
      .from("profiles")
      .update({ listing_limit: limit })
      .eq("id", agentId);
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={verify} disabled={!!busy}>
        {busy === "verify" ? "…" : "Approve verified"}
      </Button>
      <Button size="sm" variant="outline" onClick={reject} disabled={!!busy}>
        {busy === "reject" ? "…" : "Reject"}
      </Button>
      <Button size="sm" variant="danger" onClick={ban} disabled={!!busy}>
        {busy === "ban" ? "…" : "Suspend"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setListingLimit(5)}
        disabled={!!busy}
      >
        Cap at 5
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setListingLimit(null)}
        disabled={!!busy}
      >
        Unlimited
      </Button>
      {listingLimit != null && (
        <span className="self-center text-xs text-muted">Limit: {listingLimit}</span>
      )}
    </div>
  );
}
