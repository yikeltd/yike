"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TRUST_LEVEL_LABELS,
  TRUST_REVIEW_ACTION_LABELS,
  type TrustReviewAction,
} from "@/lib/verification/constants";
import type { TrustReviewQueueItem } from "@/lib/verification/review-queue";

const ALL_ACTIONS: TrustReviewAction[] = [
  "approve",
  "request_verification",
  "reduce_restrictions",
  "escalate",
  "require_whatsapp_review",
  "require_bank_verification",
  "pause_listings",
  "restore_trust",
  "suspend_temporary",
  "ban_permanent",
  "dismiss",
];

function priorityClass(priority: string): string {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-800";
    case "high":
      return "bg-amber-100 text-amber-900";
    default:
      return "bg-surface text-navy";
  }
}

export function AdminTrustReviewQueueBoard() {
  const [items, setItems] = useState<TrustReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<TrustReviewAction>("request_verification");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/trust-review-queue");
    const json = (await res.json().catch(() => ({}))) as {
      items?: TrustReviewQueueItem[];
      error?: string;
    };
    setLoading(false);
    if (!res.ok) {
      setError(json.error ?? "Could not load queue");
      return;
    }
    setItems(json.items ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(item: TrustReviewQueueItem, action: TrustReviewAction) {
    setBusyId(item.id);
    setError("");
    const res = await fetch(`/api/admin/trust-review-queue/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        userId: item.userId,
        note: note.trim() || undefined,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setBusyId(null);
    if (!res.ok) {
      setError(json.error ?? "Action failed");
      return;
    }
    await load();
  }

  async function runBulk() {
    const targets = items.filter((i) => selected.has(i.id) && i.userId);
    if (targets.length === 0) return;
    setBusyId("bulk");
    for (const item of targets) {
      await fetch(`/api/admin/trust-review-queue/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: bulkAction,
          userId: item.userId,
          note: note.trim() || undefined,
        }),
      });
    }
    setBusyId(null);
    setSelected(new Set());
    await load();
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
        <p className="text-sm text-muted">
          Suspicion scores guide prioritization — humans make final judgment. Never shown publicly.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input
            className="max-w-md flex-1"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Private admin note (optional)"
          />
          <select
            className="h-10 rounded-lg border border-navy/10 px-2 text-sm"
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value as TrustReviewAction)}
          >
            {ALL_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {TRUST_REVIEW_ACTION_LABELS[a]}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            disabled={busyId === "bulk" || selected.size === 0}
            onClick={() => void runBulk()}
          >
            Bulk action ({selected.size})
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">Loading review queue…</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-navy/10 bg-white p-6 text-sm text-muted">
          No open trust review cases.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  className="mt-1 accent-gold"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs text-muted">{item.reference}</p>
                      <p className="mt-1 font-semibold text-navy">
                        {item.userName || item.userEmail || "Unknown user"}
                      </p>
                      <p className="text-xs text-muted">{item.caseType.replace(/_/g, " ")}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityClass(item.priority)}`}
                      >
                        {item.priority}
                      </span>
                      <span className="rounded-full bg-navy/5 px-2.5 py-0.5 text-xs font-semibold text-navy">
                        Score {item.suspicionScore}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-navy">{item.reason}</p>
                  {item.trustLevel > 0 || item.signals.adaptive_trust_level != null ? (
                    <p className="mt-1 text-xs text-muted">
                      Level:{" "}
                      {TRUST_LEVEL_LABELS[
                        (item.trustLevel ||
                          item.signals.adaptive_trust_level) as keyof typeof TRUST_LEVEL_LABELS
                      ] ?? `L${item.trustLevel}`}
                    </p>
                  ) : null}
                  {item.linkedAccountIds.length > 0 ? (
                    <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-950">
                      Linked accounts (internal): {item.linkedAccountIds.length} —{" "}
                      {item.linkedAccountIds.slice(0, 3).join(", ")}
                      {item.linkedAccountIds.length > 3 ? "…" : ""}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.userId ? (
                      <Link
                        href={`/lex/auth/users/${item.userId}`}
                        className="text-xs font-semibold text-navy underline"
                      >
                        Open user
                      </Link>
                    ) : null}
                    {ALL_ACTIONS.map((action) => (
                      <Button
                        key={action}
                        size="sm"
                        variant={
                          action === "ban_permanent" || action === "suspend_temporary"
                            ? "danger"
                            : action === "approve" || action === "restore_trust"
                              ? "outline"
                              : "secondary"
                        }
                        disabled={busyId === item.id}
                        onClick={() => void runAction(item, action)}
                      >
                        {TRUST_REVIEW_ACTION_LABELS[action]}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
