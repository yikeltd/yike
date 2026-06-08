"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PinConfirmModal } from "@/components/admin/pin-confirm-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ENFORCEMENT_ACTION_LABELS,
  type EnforcementAction,
} from "@/lib/verification/enforcement";

const TRUST_ACTIONS: EnforcementAction[] = [
  "require_whatsapp",
  "require_bank",
  "require_enhanced_review",
  "restrict_listing",
  "pause_leads",
  "escalate_trust",
  "restore_trust",
  "remove_escalation",
];

const DESTRUCTIVE_ACTIONS = ["suspend", "delete"] as const;

type TrustSummary = {
  trustLevel: number;
  verificationStateLabel: string;
  suspicionScore: number;
  linkedAccountIds: string[];
  notes: { id: string; note: string; created_at: string }[];
};

export function AdminUserTrustActions({ userId }: { userId: string }) {
  const router = useRouter();
  const [summary, setSummary] = useState<TrustSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}/trust`);
    const json = (await res.json().catch(() => ({}))) as TrustSummary & { error?: string };
    setLoading(false);
    if (res.ok) setSummary(json);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(action: string) {
    setBusy(true);
    const res = await fetch(`/api/admin/users/${userId}/trust`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason, note: note.trim() || undefined }),
    });
    setBusy(false);
    if (res.ok) {
      setNote("");
      setReason("");
      await load();
      router.refresh();
    }
  }

  function requestAction(action: string) {
    setPendingAction(action);
    setShowPin(true);
  }

  if (loading && !summary) {
    return <p className="text-sm text-muted">Loading trust status…</p>;
  }

  return (
    <div className="space-y-4 rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-sm font-bold text-navy">Trust enforcement</h2>
        <p className="mt-1 text-xs text-muted">
          Escalate to verification instead of banning when possible. Suspicion score guides review only.
        </p>
      </div>

      {summary ? (
        <dl className="grid gap-2 text-sm sm:grid-cols-3">
          <div className="rounded-xl bg-surface/60 px-3 py-2">
            <dt className="text-xs text-muted">Trust level</dt>
            <dd className="font-semibold text-navy">L{summary.trustLevel}</dd>
          </div>
          <div className="rounded-xl bg-surface/60 px-3 py-2">
            <dt className="text-xs text-muted">Status</dt>
            <dd className="font-semibold text-navy">{summary.verificationStateLabel}</dd>
          </div>
          <div className="rounded-xl bg-surface/60 px-3 py-2">
            <dt className="text-xs text-muted">Suspicion (internal)</dt>
            <dd className="font-semibold text-navy">{summary.suspicionScore}</dd>
          </div>
        </dl>
      ) : null}

      {summary && summary.linkedAccountIds.length > 0 ? (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          <p className="font-semibold">Linked account indicators ({summary.linkedAccountIds.length})</p>
          <p className="mt-1 font-mono break-all">{summary.linkedAccountIds.join(", ")}</p>
        </div>
      ) : null}

      <Input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for audit log"
      />
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Private trust note (optional)"
      />

      <div className="flex flex-wrap gap-2">
        {TRUST_ACTIONS.map((action) => (
          <Button
            key={action}
            size="sm"
            variant={action.includes("restore") || action.includes("remove") ? "outline" : "secondary"}
            disabled={busy}
            onClick={() => requestAction(action)}
          >
            {ENFORCEMENT_ACTION_LABELS[action]}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-navy/5 pt-3">
        {DESTRUCTIVE_ACTIONS.map((action) => (
          <Button
            key={action}
            size="sm"
            variant="danger"
            disabled={busy}
            onClick={() => requestAction(action)}
          >
            {action === "suspend" ? "Suspend" : "Delete account"}
          </Button>
        ))}
      </div>

      {summary?.notes && summary.notes.length > 0 ? (
        <div className="space-y-2 border-t border-navy/5 pt-3">
          <p className="text-xs font-bold uppercase text-muted">Private trust notes</p>
          {summary.notes.map((n) => (
            <p key={n.id} className="rounded-lg bg-surface/50 px-3 py-2 text-xs text-navy">
              {n.note}
            </p>
          ))}
        </div>
      ) : null}

      {showPin && pendingAction ? (
        <PinConfirmModal
          title="Confirm trust action"
          onVerified={async () => {
            await runAction(pendingAction);
            setShowPin(false);
            setPendingAction(null);
          }}
          onCancel={() => {
            setShowPin(false);
            setPendingAction(null);
          }}
        />
      ) : null}
    </div>
  );
}
