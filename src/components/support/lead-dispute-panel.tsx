"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const REASONS = [
  { value: "duplicate", label: "Duplicate" },
  { value: "fake_user", label: "Fake user" },
  { value: "wrong_number", label: "Wrong number" },
  { value: "spam", label: "Spam" },
  { value: "property_unavailable", label: "Property unavailable" },
  { value: "agent_not_responsible", label: "Agent not responsible" },
] as const;

export function LeadDisputePanel({
  leadId,
  disputeStatus,
}: {
  leadId: string;
  disputeStatus: string;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [resolution, setResolution] = useState("");
  const [loading, setLoading] = useState(false);

  async function act(action: string, extra?: Record<string, unknown>) {
    setLoading(true);
    await fetch("/api/support/leads/dispute", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead_id: leadId,
        action,
        dispute_reason: reason || undefined,
        dispute_resolution: resolution || undefined,
        internal_note: note || undefined,
        ...extra,
      }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-navy/10 bg-white p-5 text-sm space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
        Dispute
      </h2>
      <p className="text-navy">
        Status: <span className="font-semibold">{disputeStatus}</span>
      </p>

      {disputeStatus === "none" && (
        <>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm"
          >
            <option value="">Select reason</option>
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Internal note (optional)"
            rows={2}
            className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={!reason || loading}
            onClick={() => void act("open")}
            className="rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            Open dispute
          </button>
        </>
      )}

      {(disputeStatus === "opened" || disputeStatus === "under_review") && (
        <div className="flex flex-wrap gap-2">
          {disputeStatus === "opened" && (
            <button
              type="button"
              disabled={loading}
              onClick={() => void act("review")}
              className="rounded-lg border border-navy/15 px-3 py-1.5 text-xs font-semibold"
            >
              Mark under review
            </button>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={() => void act("approve_refund")}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
          >
            Approve refund
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void act("reject")}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
          >
            Reject
          </button>
          <input
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Resolution note"
            className="min-w-[200px] flex-1 rounded-lg border border-navy/15 px-3 py-1.5 text-xs"
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => void act("resolve")}
            className="rounded-lg border border-navy/15 px-3 py-1.5 text-xs font-semibold"
          >
            Resolve
          </button>
        </div>
      )}
    </section>
  );
}
